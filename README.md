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

Suite Jest + Supertest, tutte le chiamate esterne (Open-Meteo, Copernicus)
sono mockate — i test girano offline e in modo deterministico:

- `__tests__/waveCalculations.test.js` — unit test puri sulla logica di
  media, formula energia onda, mappatura Scala Douglas (inclusi i valori
  esattamente sui confini tra le fasce).
- `__tests__/spots.data.test.js` — integrità del database dei 18 spot
  (id univoci, coordinate dentro i confini pugliesi, discipline valide,
  webcam_banner presente).
- `__tests__/forecast.controller.test.js` — endpoint end-to-end via
  Supertest: risposta 200 con merge corretto, 404 spot inesistente,
  degrado a solo-ECMWF se Copernicus fallisce, 502 se fallisce anche il
  vento, comportamento della cache in-memory.

## Architettura

```
server.js                        # entry point: crea l'app e chiama listen()
app.js                            # factory Express (separata per essere testabile)
scripts/
  fetch_copernicus_wave.py       # script Python: Copernicus Marine Toolbox ufficiale
  requirements.txt
src/
  data/spots.js                  # "database" mock dei 18 spot Puglia
  services/
    weatherService.js            # fetch vento da Open-Meteo (ICON-EU/AROME)
    marineService.js             # fetch mare: Open-Meteo ECMWF + Copernicus (via sottoprocesso Python)
  utils/
    waveCalculations.js          # media mare, energia onda (kJ), scala Douglas
  controllers/
    forecast.controller.js       # orchestrazione, fallback, caching in-memory
  routes/
    spots.routes.js              # GET /api/spots
    forecast.routes.js           # GET /api/forecast/:spotId
__tests__/                        # suite Jest + Supertest
```

Flusso: `routes -> controllers -> services -> utils`, così ogni layer è testabile
e sostituibile in isolamento (es. sostituire la simulazione Copernicus con una
vera integrazione CMEMS toccando solo `marineService.js`).

## Endpoint

### `GET /api/spots`
Ritorna i 18 spot con coordinate, discipline e banner webcam.

### `GET /api/forecast/:spotId`
Esempio: `GET /api/forecast/san-foca`

Esegue in parallelo:
1. Fetch vento (Open-Meteo, modelli ICON-EU/AROME) → nodi, raffiche, direzione.
2. Fetch mare (Open-Meteo, modello ECMWF) → altezza, periodo, direzione onda.
3. Simulazione Copernicus Marine (derivata da ECMWF con variazione random ±15%).
4. Merge: media altezza/periodo, direzione onda prioritaria da Copernicus.
5. Calcolo energia onda: `0.5 * altezza² * periodo * 10` (kJ, arrotondato).
6. Mappatura Scala Douglas (5 livelli).

Risposta cachata in-memory (TTL configurabile via `.env`, default 15 minuti)
per non sovraccaricare le API esterne.

### `GET /api/forecast/:spotId/daily`
Esempio: `GET /api/forecast/san-foca/daily`

Forecast sui prossimi 3 giorni. Il vento viene sempre da Open-Meteo (massimi
giornalieri). Il mare viene interrogato **per ciascun giorno** sul
microservizio [foamy-copernicus](https://github.com/Roncrypto93/foamy-copernicus)
(`GET /wave?lat=&lon=&date=YYYY-MM-DD`), che usa il dataset CMEMS
`cmems_mod_med_wav_anfc_4.2km_PT1H-i` — un prodotto "analysis **and forecast**"
con orizzonte di alcuni giorni, non solo l'istante presente. Se Copernicus non
risponde per un dato giorno, quel giorno degrada al massimo giornaliero
ECMWF di Open-Meteo (`sea.copernicusDegraded: true` per quel giorno).

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

La risposta include anche `chart`: 24 punti a step di 3 ore sui 3 giorni
(`{time, waveHeightM, wavePeriodS, waveEnergyKJ}`), per grafici temporali
più densi dei soli 3 punti giornalieri di `days`. Viene sempre da Open-Meteo
ECMWF, non da Copernicus: 24 chiamate a foamy-copernicus (una per punto)
sarebbero troppo lente sul free-tier (vedi note su `COPERNICUS_DAILY_TIMEOUT_MS`
sopra) — è un compromesso deliberato tra risoluzione temporale e velocità.

## Note per la produzione

- **Copernicus in produzione**: il server deve avere `python3` nel PATH e
  `copernicusmarine` installato, con credenziali già salvate sulla macchina
  (o iniettate via env). In Docker: installare Python + il pacchetto
  nell'immagine, e montare/creare `$HOME/.copernicusmarine-credentials` in
  fase di deploy (mai committarle nel repo).
- **Costo per richiesta**: ogni chiamata a `fetchCopernicusMarine` avvia un
  processo Python che apre una connessione remota — più lento di una fetch
  REST diretta. La cache in-memory (15 min di default) è pensata proprio per
  ammortizzare questo costo; se il traffico cresce, valutare un job
  schedulato che pre-calcola il dato Copernicus per tutti gli spot ogni ora
  invece di farlo on-demand per singola richiesta.
- **Database**: migrare `src/data/spots.js` a PostgreSQL + PostGIS quando si
  aggiungeranno altre regioni, per query geospaziali (spot più vicino, ecc.).
- **Webcam**: gli URL in `webcam_banner` sono placeholder plausibili basati sui
  network citati nel brief — vanno verificati e aggiornati uno ad uno prima
  del rilascio, perché la disponibilità dei live stream cambia nel tempo.
- **Cache**: sostituire `node-cache` con Redis quando si scala su più istanze.
- **Rate limiting**: aggiungere `express-rate-limit` sull'endpoint forecast
  prima dell'esposizione pubblica.
