# Foamy Backend — MVP Puglia

Backend Node.js/Express per l'aggregazione di forecast surf/windsurf/kitesurf
sugli spot della Puglia.

## Setup

```bash
npm install
cp .env.example .env
npm run dev   # oppure: npm start
```

Richiede Node.js >= 18 (usa `fetch` nativo per Open-Meteo, nessuna dipendenza extra).

### Copernicus Marine (dati mare reali)

Il dato Copernicus non arriva via REST diretto: Copernicus espone i suoi dati
solo tramite il **Copernicus Marine Toolbox**, che è Python-only (è l'unico
metodo di accesso programmatico ufficialmente supportato). Il backend Node
invoca quindi `scripts/fetch_copernicus_wave.py` come sottoprocesso.

```bash
pip install -r scripts/requirements.txt
copernicusmarine login   # una tantum, salva le credenziali in $HOME/.copernicusmarine-credentials
```

Verifica rapida dello script (con credenziali già configurate):

```bash
python3 scripts/fetch_copernicus_wave.py 40.3283 18.3639
```

⚠️ **Prima del primo deploy**: il `dataset_id` di default nello script
(`cmems_mod_med_wav_anfc_4.2km_PT1H-i`) va confermato con:

```bash
copernicusmarine describe --contains MEDSEA_ANALYSISFORECAST_WAV_006_017
```

perché gli id tecnici dei dataset possono cambiare tra versioni del prodotto.
Se necessario, sovrascrivilo con `COPERNICUS_DATASET_ID` in `.env`.

Se Copernicus non risponde entro `COPERNICUS_TIMEOUT_MS` (default 20s) o va in
errore, l'endpoint `/api/forecast/:spotId` **non fallisce**: degrada con
grazia usando solo il dato Open-Meteo/ECMWF e imposta `sea.copernicusDegraded: true`
nella risposta.

## Test

```bash
npm test
```

Suite Jest + Supertest, tutte le chiamate esterne (Open-Meteo, Copernicus,
Upstash) sono mockate — i test girano offline e in modo deterministico:

- `waveCalculations.test.js` — unit test puri sulla logica di media, formula
  energia onda, mappatura Scala Douglas (inclusi i valori esattamente sui
  confini tra le fasce).
- `spots.data.test.js` — integrità del database dei 20 spot (id univoci,
  coordinate dentro i confini pugliesi, discipline valide, webcam_banner
  valido o esplicitamente `null`, spot_info completo).
- `forecast.controller.test.js` — endpoint condizioni attuali end-to-end via
  Supertest: risposta 200 con merge corretto, 404 spot inesistente, degrado
  a solo-ECMWF se Copernicus fallisce, 502 se fallisce anche il vento,
  comportamento della cache.
- `dailyForecast.controller.test.js` — endpoint `/daily` end-to-end: 7
  giorni con energia/Scala Douglas calcolate, `chart`/`windChart` a step di
  3 ore, 404, 502, cache.
- `dailyMarineService.test.js` — logica di limitazione Copernicus: solo i
  primi `COPERNICUS_REAL_DAYS` giorni interrogano davvero foamy-copernicus,
  56 punti nei grafici, degrado corretto (skip vs fallimento reale) per i
  giorni oltre il limite e per un errore Copernicus, rispetto della env var.
- `forecastCache.test.js` — cache a due livelli: TTL di default e da env,
  comportamento con/senza Upstash configurato, degrado con grazia se
  Upstash non risponde.

## Architettura

Tutti i file sono nella root del repo (nessuna sotto-cartella `src/`):

```
server.js                  # entry point: crea l'app e chiama listen()
app.js                      # factory Express (separata per essere testabile)
fetch_copernicus_wave.py   # script Python: Copernicus Marine Toolbox ufficiale
                            # (non ancora invocato da marineService.js, vedi sotto)
requirements.txt
spots.js                    # "database" mock dei 20 spot Puglia + spot_info
spots.routes.js             # GET /api/spots
weatherService.js           # fetch vento da Open-Meteo (ICON-EU/AROME) — condizioni attuali
marineService.js            # fetch mare Open-Meteo ECMWF — condizioni attuali;
                            # fetchCopernicusMarine() qui è uno stub che fallisce
                            # sempre (nessuna integrazione Copernicus per le
                            # condizioni attuali, solo per /daily sotto)
waveCalculations.js         # media mare, energia onda (kJ), scala Douglas
forecast.controller.js      # GET /api/forecast/:spotId — condizioni attuali
forecast.routes.js
dailyMarineService.js       # GET /api/forecast/:spotId/daily — Copernicus reale
                            # per i primi COPERNICUS_REAL_DAYS giorni via
                            # foamy-copernicus, + chart/windChart a step di 3h
                            # da Open-Meteo (7 giorni)
dailyForecast.controller.js
forecastCache.js            # cache condivisa (in-memory + Upstash Redis opzionale)
*.test.js                   # suite Jest + Supertest, accanto al file che testano
```

Flusso: `routes -> controller -> service -> utils`, con `forecastCache`
condiviso da entrambi i controller forecast. Le condizioni attuali e il
forecast settimanale sono deliberatamente disaccoppiati (vedi commenti in
`dailyMarineService.js`): il primo usa solo Open-Meteo/ECMWF, il secondo usa
Copernicus reale via `foamy-copernicus` per i primi giorni.

## Endpoint

### `GET /api/spots`
Ritorna i 20 spot con coordinate, discipline, banner webcam e spot_info.

### `GET /api/forecast/:spotId`
Esempio: `GET /api/forecast/san-foca`

Esegue in parallelo:
1. Fetch vento (Open-Meteo, modelli ICON-EU/AROME) → nodi, raffiche, direzione.
2. Fetch mare (Open-Meteo, modello ECMWF) → altezza, periodo, direzione onda.
3. Tentativo Copernicus Marine (`fetchCopernicusMarine` in `marineService.js`)
   — oggi è uno stub che fallisce sempre (nessun sottoprocesso Python attivo
   su questo deploy Node/Render), quindi degrada sempre sul solo ECMWF.
   L'integrazione Copernicus reale esiste solo per `/daily` sotto, via il
   microservizio separato foamy-copernicus.
4. Merge: media altezza/periodo, direzione onda prioritaria da Copernicus
   (quando disponibile).
5. Calcolo energia onda: `0.5 * altezza² * periodo * 10` (kJ, arrotondato).
6. Mappatura Scala Douglas (5 livelli).

Risposta cachata (in-memory + Upstash Redis opzionale, TTL configurabile via
`.env`, default 180 minuti — vedi sezione "Cache" sotto)
per non sovraccaricare le API esterne.

### `GET /api/forecast/:spotId/daily`
Esempio: `GET /api/forecast/san-foca/daily`

Forecast sui prossimi **7 giorni** (`days`). Il vento viene sempre da
Open-Meteo (massimi giornalieri). Il mare viene interrogato sul microservizio
[foamy-copernicus](https://github.com/Roncrypto93/foamy-copernicus)
(`GET /wave?lat=&lon=&date=YYYY-MM-DD`, dataset CMEMS
`cmems_mod_med_wav_anfc_4.2km_PT1H-i` — un prodotto "analysis **and
forecast**" con orizzonte reale fino a 10 giorni) **solo per i primi
`COPERNICUS_REAL_DAYS` giorni** (default 3, configurabile via `.env`). Oltre
quel limite non si tenta nemmeno Copernicus: si usa direttamente il massimo
giornaliero ECMWF di Open-Meteo. Motivo: ogni chiamata a foamy-copernicus
impiega 15-45s ed è sequenziale (il parallelo sovraccarica l'istanza
free-tier) — farlo per tutti e 7 i giorni porterebbe il caso peggiore a
~5 minuti. Se Copernicus non risponde entro il timeout anche per un giorno
nei primi `COPERNICUS_REAL_DAYS`, quel giorno degrada allo stesso modo
(`sea.copernicusDegraded: true`).

Richiede la variabile `COPERNICUS_SERVICE_URL` (default `http://localhost:5000`)
puntata a un'istanza in esecuzione di foamy-copernicus. Non tocca né usa
`marineService.js` — le condizioni attuali restano invariate.

Ogni giorno include anche `sea.waterTempC` (temperatura superficiale del
mare) e `sea.seaLevelM` (livello del mare — il proxy più vicino alla marea
astronomica che Open-Meteo espone: include marea + effetto barometro
inverso + altre componenti, non è la marea pura). Entrambi vengono dalla
stessa chiamata Marine di Open-Meteo usata per le onde ECMWF (valore alle
12:00 locali di ciascun giorno), perché CMEMS/Copernicus qui fornisce solo
altezza/periodo/direzione onda.

La risposta include anche `chart`: 56 punti a step di 3 ore sui 7 giorni
(`{time, waveHeightM, wavePeriodS, waveEnergyKJ}`), per grafici temporali
più densi dei soli 7 punti giornalieri di `days`. Viene sempre da Open-Meteo
ECMWF, non da Copernicus, per lo stesso motivo di sopra (troppo lento a
questa risoluzione sul free-tier).

Stessa risoluzione anche per il vento in `windChart` (`{time, windSpeedKn,
windGustsKn, windDirectionDeg}`, 56 punti), dalla stessa chiamata Open-Meteo
già usata per i massimi giornalieri — nessuna chiamata aggiuntiva.

## Cache

`forecastCache.js` è condiviso da entrambi gli endpoint forecast (chiavi
`forecast:<spotId>` e `daily:<spotId>`, quindi indipendenti tra loro) e
lavora su due livelli:

1. **In-memory** (`node-cache`) — istantanea, ma azzerata ad ogni riavvio.
2. **Upstash Redis** (REST, opzionale) — persistente: sopravvive ai riavvii,
   fondamentale su Render free perché l'istanza si addormenta dopo 15 minuti
   di inattività e perde tutto lo stato in-memory. Senza questo livello, ogni
   "risveglio" del servizio azzera la cache e può far esaurire più in fretta
   la quota gratuita giornaliera di Open-Meteo (10.000 richieste/giorno,
   condivisa con altri servizi sullo stesso IP di uscita di Render).

TTL condiviso 180 minuti di default (`FORECAST_CACHE_TTL`, in secondi).

**Setup Upstash** (opzionale ma consigliato in produzione):
1. Account gratuito su [upstash.com](https://upstash.com) → Redis → Create Database.
2. Nella scheda "REST API" del database, copia `UPSTASH_REDIS_REST_URL` e
   `UPSTASH_REDIS_REST_TOKEN`.
3. Impostale come variabili d'ambiente sul servizio Render (non nel repo).

Se non sono impostate, o se Upstash non risponde entro `UPSTASH_TIMEOUT_MS`
(default 5s), il backend degrada con grazia sulla sola cache in-memory —
stesso comportamento di prima, nessuna richiesta utente fallisce per questo.

## Note per la produzione

- **Copernicus in produzione**: il server deve avere `python3` nel PATH e
  `copernicusmarine` installato, con credenziali già salvate sulla macchina
  (o iniettate via env). In Docker: installare Python + il pacchetto
  nell'immagine, e montare/creare `$HOME/.copernicusmarine-credentials` in
  fase di deploy (mai committarle nel repo).
- **Costo per richiesta**: ogni chiamata a `fetchCopernicusMarine` avvia un
  processo Python che apre una connessione remota — più lento di una fetch
  REST diretta. La cache (180 min di default, vedi sotto) è pensata proprio
  per ammortizzare questo costo; se il traffico cresce, valutare un job
  schedulato che pre-calcola il dato Copernicus per tutti gli spot ogni ora
  invece di farlo on-demand per singola richiesta.
- **Database**: migrare `spots.js` a PostgreSQL + PostGIS quando si
  aggiungeranno altre regioni, per query geospaziali (spot più vicino, ecc.).
- **Webcam**: i link in `webcam_banner` sono stati verificati via ricerca web
  (luglio 2026) per tutti i 20 spot. Dove non esisteva una webcam esatta sullo
  spot, `webcam_banner.fallback` + `.note` lo segnalano esplicitamente invece
  di presentare un link non pertinente come se fosse quello giusto; alcuni
  link (vedi commento in cima a `spots.js`) sono ancora marcati "da
  verificare" perché la ricerca automatica non è riuscita a confermarli.
  `webcam_banner` è `null` dove non è stata trovata nessuna fonte utilizzabile.
- **Rate limiting**: aggiungere `express-rate-limit` sull'endpoint forecast
  prima dell'esposizione pubblica.
