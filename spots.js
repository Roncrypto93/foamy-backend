/**
 * Database mock degli spot Puglia per l'MVP di Foamy.
 * 19 spot (Frassanito e Alimini sono due spot distinti).
 *
 * webcam_banner: quando la webcam non è esattamente sullo spot (fallback su
 * uno spot vicino) o non è stato possibile verificarne il funzionamento,
 * `fallback: true` e `note` lo segnalano esplicitamente — non è stato
 * possibile confermare visivamente ogni singolo link (ricerca web luglio
 * 2026), quindi vanno ricontrollati manualmente prima di considerarli
 * definitivi. `webcam_banner: null` dove non è stata trovata nessuna
 * webcam utilizzabile.
 *
 * spot_info: fondale, strutture e descrizione tecnica da guide surf/kite
 * italiane (kitesurfing.it, localsalentokitesurf.com, kitesurfculture.com,
 * SurfTribe, siti di scuole locali). Dove le fonti non erano concordi o
 * sufficienti, il testo lo segnala come "dato non pienamente verificato".
 */

const SPOTS = [
  {
    id: "san-foca", name: "San Foca (Li Marangi)", coast: "Adriatico", disciplines: ["wave", "kite"], lat: 40.3283, lon: 18.3639,
    webcam_banner: { provider: "Wind24 (Porto San Foca)", url: "https://www.wind24.it/sanfoca/webcam/Porto-0024", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbia, con alcune formazioni rocciose che creano piscine naturali vicino riva",
      strutture: "Scuole di kite (es. Sea and Soul presso Lido Buenaventura), rimessaggio attrezzatura, ristoro e stabilimento balneare",
      descrizione_tecnica: "Uno dei migliori spot kite della costa adriatica salentina, lavora con Tramontana (N). Baia semi-riparata con fondale sabbioso sicuro, adatta a principianti e intermedi; con vento forte offre condizioni anche per esperti."
    }
  },
  {
    id: "torre-dellorso", name: "Torre dell'Orso", coast: "Adriatico", disciplines: ["wave"], lat: 40.2717, lon: 18.4235,
    webcam_banner: { provider: "SkylineWebcams (fallback: Alimini, ~7km)", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/lecce/spiaggia-di-alimini.html", embed_type: "iframe_redirect", fallback: true, note: "Nessuna webcam trovata direttamente su Torre dell'Orso: mostriamo quella di Alimini, la più vicina disponibile." },
    spot_info: {
      fondale: "Misto — sabbia finissima con formazioni rocciose (gli scogli delle 'Due Sorelle') e scogli sommersi",
      strutture: "Scuole di kitesurf in zona (es. Kite Salento); consigliata cautela per gli scogli",
      descrizione_tecnica: "Baia riparata da falesie bianche, lavora bene solo con venti settentrionali (Tramontana/Maestrale). La presenza di scogli affioranti la rende più adatta a livello intermedio. A luglio-agosto il kite è di fatto sconsigliato per l'affollamento turistico."
    }
  },
  {
    id: "frassanito", name: "Frassanito", coast: "Adriatico", disciplines: ["wind", "kite", "wave"], lat: 40.2261, lon: 18.4584,
    webcam_banner: { provider: "Eolo Online (stazione meteo/vento live)", url: "https://www.eoloonline.it/frassanito.html", embed_type: "iframe_redirect", note: "Stazione meteo con dati vento in diretta, non una webcam fotografica classica." },
    spot_info: {
      fondale: "Reef/Roccia — piccole rocce sommerse vicino riva, da attenzionare in ingresso e in rientro",
      strutture: "Scuola kite AK con base estiva presso il VOI Resort Alimini, noleggio attrezzatura",
      descrizione_tecnica: "Spot molto rinomato, lavora bene con Tramontana/NNW (onda) e con Scirocco (S) per onde di qualità, esposizione prevalentemente side-onshore. Consigliato a livello intermedio/esperto per la presenza del reef."
    }
  },
  {
    id: "alimini", name: "Alimini", coast: "Adriatico", disciplines: ["wind", "kite", "wave"], lat: 40.2519, lon: 18.4506,
    webcam_banner: { provider: "SkylineWebcams", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/lecce/spiaggia-di-alimini.html", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbia, con tratti misti vicino alla foce dei laghi (dettaglio non pienamente verificato)",
      strutture: "Scuole di kite/windsurf (es. AK presso VOI Resort), ampio parcheggio essendo area turistica",
      descrizione_tecnica: "Lavora bene con Tramontana (N) e Scirocco (S), come la vicina Frassanito. Adatto a tutti i livelli nelle zone più riparate vicino ai laghi, mentre il tratto di mare aperto richiede più esperienza."
    }
  },
  {
    id: "rosamarina-ostuni", name: "Rosamarina di Ostuni", coast: "Adriatico", disciplines: ["wave", "wind"], lat: 40.7333, lon: 17.6667,
    webcam_banner: { provider: "Wind24 (fallback: Porto di Villanova, ~1-2km)", url: "https://www.wind24.it/ostuni/webcam/Porto-turistico-0029", embed_type: "iframe_redirect", fallback: true, note: "Nessuna webcam trovata esattamente su Rosa Marina: mostriamo quella del porto turistico di Villanova, la frazione adiacente." },
    spot_info: {
      fondale: "Sabbia, con pochi scogli",
      strutture: "Servizio di salvataggio stagionale (1 giugno - 15 settembre); scuole/noleggi dedicati non confermati con fonte diretta",
      descrizione_tecnica: "Funziona con vento di Maestrale side-shore, adatto a freeride/slalom con onde fino a 3,5m nei periodi più intensi. In estate condizioni più leggere, con onda occasionale a fine stagione."
    }
  },
  {
    id: "porto-cesareo-reef", name: "Porto Cesareo (Il Reef)", coast: "Ionio", disciplines: ["wave", "wind", "kite"], lat: 40.2606, lon: 17.8994,
    webcam_banner: { provider: "SkylineWebcams (fallback: centro Porto Cesareo)", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/lecce/porto-cesareo.html", embed_type: "iframe_redirect", fallback: true, note: "Nessuna webcam dedicata esattamente al Reef/Baia Grande: mostriamo quella del centro di Porto Cesareo." },
    spot_info: {
      fondale: "Misto — reef roccioso nella Baia Grande che forma l'onda, sabbioso nella Laguna della Strea",
      strutture: "Scuole di kitesurf (es. Locals Crew ASD); lancio da spiaggia consentito solo fuori stagione balneare per ordinanza",
      descrizione_tecnica: "Funziona con venti da SSE a ONO (Scirocco-Maestrale-Ponente). Nella Baia Grande l'onda si forma sul reef, sconsigliata ai principianti; nella Laguna della Strea acqua piatta ideale per freestyle a tutti i livelli."
    }
  },
  {
    id: "vieste-scialmarino", name: "Vieste (Spiaggia di Scialmarino)", coast: "Gargano", disciplines: ["wind", "kite"], lat: 41.9036, lon: 16.144,
    webcam_banner: { provider: "GarganSurf (fallback: Cala Azzurra, ~4-5km)", url: "https://garganosurf.com/it/servizi/webcam/", embed_type: "iframe_redirect", fallback: true, note: "Nessuna webcam dedicata trovata su Scialmarino: mostriamo quella di Cala Azzurra, zona surf di Vieste." },
    spot_info: {
      fondale: "Sabbioso e digradante, protetto a nord da scogliere",
      strutture: "Scuola presso il Villaggio Oasi Vieste, noleggio attrezzatura",
      descrizione_tecnica: "Funziona con venti termici da nord e sud, moderati e costanti; periodo migliore maggio-giugno e settembre. Baia riparata dalle scogliere, adatta soprattutto a principianti e livello intermedio."
    }
  },
  {
    id: "torre-san-giovanni", name: "Torre San Giovanni", coast: "Ionio", disciplines: ["wind", "kite"], lat: 39.8508, lon: 18.3311,
    webcam_banner: { provider: "SkylineWebcams", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/lecce/torre-san-giovanni-ugento.html", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbia bianca fine, bassa, protetta da una fila di isolotti/scogli paralleli alla costa",
      strutture: "Scuola kitesurf/windsurf attiva tutto l'anno (Lega Navale Italiana), gommone di assistenza in estate",
      descrizione_tecnica: "Funziona con Scirocco invernale (15-35 nodi) e vento termico da Ovest in estate (15-18 nodi). Acqua piatta e bassa, ideale per freeride/freestyle/big air. Adatto a tutti i livelli."
    }
  },
  {
    id: "gallipoli-baia-verde", name: "Gallipoli (Baia Verde)", coast: "Ionio", disciplines: ["wind", "kite", "wave"], lat: 40.0389, lon: 17.9836,
    webcam_banner: { provider: "SkylineWebcams", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/lecce/spiaggia-gallipoli.html", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbioso, spiaggia larga con facile accesso",
      strutture: "Scuola Salento Coast Ovest dal 2004, noleggio presso Ecoresort Le Sirenè",
      descrizione_tecnica: "Funziona con vento da NO a S; le mareggiate invernali generano onde fino a 2m. Spot cittadino adatto a principianti in condizioni normali. Lancio da spiaggia vietato in estate (giu-set) per ordinanza balneare."
    }
  },
  {
    id: "campomarino-curvone", name: "Campomarino di Maruggio (Il Curvone)", coast: "Ionio", disciplines: ["wave"], lat: 40.3928, lon: 17.6119,
    webcam_banner: { provider: "La Bahia del Sol (Marina di Lizzano, stesso tratto costiero)", url: "https://www.labahiadelsol.it/webcam-live/", embed_type: "iframe_redirect", fallback: true, note: "'Il Curvone' è catalogato come spot di Marina di Lizzano: la webcam è praticamente sullo stesso tratto di costa." },
    spot_info: {
      fondale: "Roccia/Misto — dato non pienamente univoco tra le fonti consultate",
      strutture: "Dato non verificato: nessuna scuola dedicata trovata; presente il lido Bahia del Sol nella zona adiacente",
      descrizione_tecnica: "Lavora bene con Scirocco e con vento da Est-Nord-Est. Onde alte e potenti sul fondale roccioso, adatto a livello intermedio/esperto — sconsigliato ai principianti per la scogliera."
    }
  },
  {
    id: "torre-lapillo-punta-prosciutto", name: "Torre Lapillo / Punta Prosciutto", coast: "Ionio", disciplines: ["kite", "wind"], lat: 40.3167, lon: 17.8667,
    webcam_banner: { provider: "SkylineWebcams (fallback: Porto Cesareo, ~3-5km)", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/lecce/porto-cesareo.html", embed_type: "iframe_redirect", fallback: true, note: "Nessuna webcam dedicata trovata esattamente su Torre Lapillo/Punta Prosciutto." },
    spot_info: {
      fondale: "Sabbia, fondale basso e digradante per 50-70 metri dalla riva",
      strutture: "Scuola kite a 'La Strea' (laguna a sud, acqua piatta), hotel, bar/ristoranti, ampio parcheggio",
      descrizione_tecnica: "Costa ionica esposta soprattutto a Maestrale (NW), velocità media ~11 nodi con raffiche fino a 22. Fondale sabbioso e basso adatto a principianti vicino riva; la laguna della Strea è ideale per il freestyle."
    }
  },
  {
    id: "gallipoli-lido-pizzo", name: "Gallipoli (Lido Pizzo)", coast: "Ionio", disciplines: ["kite", "wind"], lat: 40.0667, lon: 17.9833,
    webcam_banner: { provider: "Wind24 (Lido Pizzo)", url: "https://win.wind24.it/gallipoli/webcam/Lido-Pizzo-0022", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Misto — piccola baia sabbiosa con alcune rocce che affiorano vicino alla riva",
      strutture: "Scuola kite Salento Coast Ovest Kitesurf, attiva tutto l'anno",
      descrizione_tecnica: "Unico spot della costa ionica del Salento navigabile con venti da Nord/Nord-Est. Onde lunghe non troppo alte. La presenza di rocce affioranti lo rende più adatto a livello intermedio/esperto."
    }
  },
  {
    id: "bari-pane-pomodoro", name: "Bari (Pane e Pomodoro)", coast: "Adriatico", disciplines: ["kite", "wind"], lat: 41.1256, lon: 16.8719,
    webcam_banner: { provider: "SkylineWebcams", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/bari/spiaggia-di-bari.html", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbia (dettagli su profondità e pendenza non pienamente verificati)",
      strutture: "Portale locale TanaOnda dedicato a surf/windsurf/kite in zona; spiaggia cittadina con lungomare",
      descrizione_tecnica: "Dato non pienamente verificato: le fonti non specificano con certezza i venti ideali. Spot cittadino sul litorale nord di Bari, generalmente considerato accessibile anche a principianti per la vicinanza ai servizi urbani."
    }
  },
  {
    id: "monopoli-capitolo", name: "Monopoli (Capitolo)", coast: "Adriatico", disciplines: ["wind", "kite", "wave"], lat: 40.9333, lon: 17.2667,
    webcam_banner: { provider: "PugliaWebcam (Lido Bambù)", url: "https://pugliawebcam.it/webcam/monopoli-capitolo/en", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Misto sabbia-roccia in gran parte dell'area",
      strutture: "Numerosi lidi attrezzati (noleggio lettini, docce, bar, ristoranti, parcheggio privato)",
      descrizione_tecnica: "La costa beneficia di venti di Tramontana e Grecale, con beach-break/reef-break tecnici. Esposizione e livello consigliato non pienamente dettagliati dalle fonti — presumibile onshore, frequentato anche da rider esperti quando il vento spinge l'onda a riva."
    }
  },
  {
    id: "torre-guaceto", name: "Torre Guaceto", coast: "Adriatico", disciplines: ["kite"], lat: 40.7167, lon: 17.8,
    webcam_banner: { provider: "Wind24 (Torre Guaceto)", url: "https://win.wind24.it/torreguaceto", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbia",
      strutture: "Scuola Kite Salento (corsi IKO, noleggio, kite camp), Sporting Club Torre Guaceto, struttura balneare Guna Beach partner",
      descrizione_tecnica: "Vento a raffiche, costante, direzione side-shore/side-onshore da Ovest ed Est; funziona da 10-20 fino a 20-40 nodi. Stagione migliore maggio-ottobre. Baia riparata adatta a principianti, ma frequentata anche da atleti di alto livello."
    }
  },
  {
    id: "frigole", name: "Frigole", coast: "Adriatico", disciplines: ["kite", "wind"], lat: 40.4667, lon: 18.2667,
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia",
      strutture: "Spiaggia attrezzata con bar, ristorante, docce, parcheggio gratuito; scuola kite dedicata (Scuola Kite Lecce, area riservata presso il 'Molo Tredici' in estate)",
      descrizione_tecnica: "Spot ventilato dall'effetto Venturi del Canale d'Otranto. Da maggio a settembre vento dominante Maestrale e Tramontana; con Scirocco/SE si genera termica da est (14-25 nodi). Fondale sabbioso e spiaggia poco affollata: ottimo spot per principianti."
    }
  },
  {
    id: "torre-canne", name: "Torre Canne", coast: "Adriatico", disciplines: ["wind", "kite", "wave"], lat: 40.8167, lon: 17.4333,
    webcam_banner: { provider: "MeteoTorreCanne (da verificare)", url: "https://meteotorrecanne.it", embed_type: "iframe_redirect", fallback: true, note: "Citato da più fonti come webcam attiva del porto, ma non è stato possibile verificarne il funzionamento in questa ricerca (sito non raggiungibile durante il test). Controllare manualmente." },
    spot_info: {
      fondale: "Misto — sabbioso nella zona centrale (Bandiera Blu), più roccioso verso sud in direzione Pilone/Rosa Marina",
      strutture: "SKP – Kitesurf Puglia School attiva; la storica scuola windsurf Birinbau risulta chiusa da alcuni anni",
      descrizione_tecnica: "Funziona tutto l'anno con venti da NNW (Maestrale), e in estate/primavera anche con termica da est. Il porto turistico offre riparo parziale con Maestrale forte, adatto a principianti in quelle condizioni; con vento forte frequentato anche da intermedi ed esperti."
    }
  },
  {
    id: "peschici-baia-manaccora", name: "Peschici (Baia di Manaccora)", coast: "Gargano", disciplines: ["wind", "kite"], lat: 41.95, lon: 16.0167,
    webcam_banner: { provider: "Windy (da verificare)", url: "https://www.windy.com/it/-Webcam/Italia/Puglia/Peschici/Baia-di-Manaccora/webcams/1216718159", embed_type: "iframe_redirect", fallback: true, note: "Indicizzata come attiva da più portali (worldcam.eu, vedetta.org) ma non confermata visivamente in questa ricerca. Controllare manualmente." },
    spot_info: {
      fondale: "Sabbia fine, con scogliere/promontori rocciosi ai lati della baia",
      strutture: "Villaggio Baia di Manaccora con bar/ristorante, corsi di windsurf e kitesurf",
      descrizione_tecnica: "Spot esposto a venti da NW e SE (termico) per condizioni freestyle in estate. Con vento da N si generano onde non consigliate se non a livello molto esperto, per via di due punte rocciose che delimitano la baia."
    }
  },
  {
    id: "marina-di-lesina", name: "Marina di Lesina", coast: "Gargano", disciplines: ["wind", "kite"], lat: 41.8833, lon: 15.3667,
    webcam_banner: null,
    spot_info: {
      fondale: "Bacino lacustre salmastro (Lago di Lesina), profondità massima 1,5m, flat water — non è uno spot di mare aperto",
      strutture: "Gargano Lake Kite School con pontile di partenza e servizio di recupero in barca (safety boat)",
      descrizione_tecnica: "Attenzione geografica: lo spot reale è sul Lago di Lesina, laguna interna a sud della marina, non sul mare aperto. Acqua piatta, fondale basso e venti ideali da Sud, Sud-Ovest e Ovest. Ideale per principianti e freestyle grazie all'assenza di onde."
    }
  },
];

module.exports = SPOTS;
