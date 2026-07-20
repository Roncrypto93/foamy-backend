/**
 * Database mock degli spot per l'MVP di Foamy — Puglia (20 spot) e Sicilia
 * (56 spot, aggiunti in una seconda fase).
 *
 * region: "Puglia" | "Sicilia" — aggiunto anche retroattivamente ai 20 spot
 * Puglia già esistenti (solo dato, nessun'altra modifica ai loro valori).
 * Risolve anche l'ambiguità del campo `coast`: "Ionio" è usato sia per la
 * Puglia (Salento ionico) sia per la Sicilia (costa orientale) — sono mari
 * diversi nella realtà, `region` li distingue.
 *
 * coast per la Sicilia: "Tirreno" (costa nord, Trapani nord → Messina lato
 * tirrenico), "Ionio" (costa est, Messina lato ionico → Siracusa fino a
 * Capo Passero), "Canale di Sicilia" (costa sud/sud-ovest, da Capo Passero
 * a ovest fino a Trapani sud). Portopalo e Il Reef Dell'Isola sono
 * esattamente sullo spartiacque geografico (Capo Passero): classificati
 * Ionio per convenzione, ma è una scelta arbitraria da poter rivedere.
 *
 * coordsSource (solo Sicilia): "surfline" per i 4 spot di cui Surfline
 * pubblica coordinate proprie nel suo database (Backdoor, Torre Muzzard,
 * Ponente, Il Reef Dell'Isola — estratte da __NEXT_DATA__ delle rispettive
 * pagine, luglio 2026), "estimate" per tutti gli altri: coordinate stimate
 * dal centro abitato/litorale noto più vicino, non da un posizionamento
 * geografico verificato punto per punto. Da ricontrollare prima di
 * considerarle definitive, specialmente per gli spot con più break
 * ravvicinati (es. i 4 di Cefalù condividono la stessa stima).
 *
 * webcam_banner: null per tutti gli spot Sicilia — nessuna ricerca webcam
 * è stata fatta in questa fase (a differenza della Puglia), quindi meglio
 * nessun link che uno indovinato. Multi-break nello stesso posto (es.
 * "Cefalù (Lungomare)", "Cefalù (Santa Lucia)") seguono lo stesso schema
 * già usato in Puglia per "Gallipoli (Baia Verde)" / "Gallipoli (Lido
 * Pizzo)": una entry per break, non un'unica entry per località.
 *
 * spot_info per la Sicilia: fondale/mareggiate dalle note fornite
 * dall'utente (dedotte da Surflione, TheSurfAtlas, SurfProject.it, guide
 * locali kite). Dove le note non menzionavano scuole/strutture specifiche,
 * il campo lo segnala esplicitamente invece di inventarle — a differenza
 * della Puglia, qui non è stata fatta una ricerca dedicata sulle strutture.
 */

const SPOTS = [
  // ==================== PUGLIA (20 spot) ====================
  {
    id: "san-foca", name: "San Foca (Li Marangi)", coast: "Adriatico", region: "Puglia", disciplines: ["wave", "kite"], lat: 40.3283, lon: 18.3639,
    webcam_banner: { provider: "Webcam Li Marangi", url: "http://ffmpeg.pwad.it/videos/sanfoca.mp4?t=20230517165515", note: "Il link apre il file video direttamente in una nuova scheda (il sito non supporta connessioni sicure, quindi non può essere mostrato dentro la pagina)." },
    spot_info: {
      fondale: "Sabbia, con alcune formazioni rocciose che creano piscine naturali vicino riva",
      strutture: "Scuole di kite (es. Sea and Soul presso Lido Buenaventura), rimessaggio attrezzatura, ristoro e stabilimento balneare",
      descrizione_tecnica: "Lavora con Tramontana (N). Fondale sabbioso sicuro: adatto a principianti ed esperti."
    }
  },
  {
    id: "torre-dellorso", name: "Torre dell'Orso", coast: "Adriatico", region: "Puglia", disciplines: ["wave"], lat: 40.2717, lon: 18.4235,
    webcam_banner: null,
    spot_info: {
      fondale: "Misto — sabbia finissima con formazioni rocciose (gli scogli delle 'Due Sorelle') e scogli sommersi",
      strutture: "Scuole di kitesurf in zona (es. Kite Salento); consigliata cautela per gli scogli",
      descrizione_tecnica: "Lavora solo con venti settentrionali (Tramontana/Maestrale). Scogli affioranti: livello intermedio."
    }
  },
  {
    id: "frassanito", name: "Frassanito", coast: "Adriatico", region: "Puglia", disciplines: ["wind", "kite", "wave"], lat: 40.2261, lon: 18.4584,
    webcam_banner: { provider: "Eolo Online (stazione meteo/vento live)", url: "https://www.eoloonline.it/frassanito.html", embed_type: "iframe_redirect", note: "Stazione meteo con dati vento in diretta, non una webcam fotografica classica." },
    spot_info: {
      fondale: "Reef/Roccia — piccole rocce sommerse vicino riva, da attenzionare in ingresso e in rientro",
      strutture: "Scuola kite AK con base estiva presso il VOI Resort Alimini, noleggio attrezzatura",
      descrizione_tecnica: "Lavora con Tramontana/NNW e Scirocco (S). Reef roccioso: livello intermedio/esperto."
    }
  },
  {
    id: "alimini", name: "Alimini", coast: "Adriatico", region: "Puglia", disciplines: ["wind", "kite", "wave"], lat: 40.2519, lon: 18.4506,
    webcam_banner: { provider: "SkylineWebcams", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/lecce/spiaggia-di-alimini.html", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbia, con tratti misti vicino alla foce dei laghi",
      strutture: "Scuole di kite/windsurf (es. AK presso VOI Resort), ampio parcheggio essendo area turistica",
      descrizione_tecnica: "Lavora con Tramontana (N) e Scirocco (S). Adatto a tutti i livelli nelle zone riparate."
    }
  },
  {
    id: "rosamarina-ostuni", name: "Rosamarina di Ostuni", coast: "Adriatico", region: "Puglia", disciplines: ["wave", "wind"], lat: 40.7333, lon: 17.6667,
    webcam_banner: { provider: "Wind24 (fallback: Porto di Villanova, ~1-2km)", url: "https://www.wind24.it/ostuni/webcam/Porto-turistico-0029", embed_type: "iframe_redirect", fallback: true, note: "Nessuna webcam trovata esattamente su Rosa Marina: mostriamo quella del porto turistico di Villanova, la frazione adiacente." },
    spot_info: {
      fondale: "Sabbia, con pochi scogli",
      strutture: "Servizio di salvataggio stagionale (1 giugno - 15 settembre)",
      descrizione_tecnica: "Lavora con Maestrale side-shore. Onde fino a 3,5m nei periodi più intensi: freeride/slalom."
    }
  },
  {
    id: "porto-cesareo-reef", name: "Porto Cesareo (Il Reef)", coast: "Ionio", region: "Puglia", disciplines: ["wave", "wind", "kite"], lat: 40.2606, lon: 17.8994,
    webcam_banner: { provider: "SkylineWebcams (fallback: centro Porto Cesareo)", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/lecce/porto-cesareo.html", embed_type: "iframe_redirect", fallback: true, note: "Nessuna webcam dedicata esattamente al Reef/Baia Grande: mostriamo quella del centro di Porto Cesareo." },
    spot_info: {
      fondale: "Misto — reef roccioso nella Baia Grande che forma l'onda, sabbioso nella Laguna della Strea",
      strutture: "Scuole di kitesurf (es. Locals Crew ASD); lancio da spiaggia consentito solo fuori stagione balneare per ordinanza",
      descrizione_tecnica: "Lavora con Scirocco-Maestrale-Ponente (SSE-ONO). Reef per esperti; laguna piatta per tutti i livelli."
    }
  },
  {
    id: "vieste-scialmarino", name: "Vieste (Spiaggia di Scialmarino)", coast: "Gargano", region: "Puglia", disciplines: ["wind", "kite"], lat: 41.9036, lon: 16.144,
    webcam_banner: { provider: "Vedetta.org", url: "https://vedetta.org/webcam/italia/puglia/foggia/vieste/", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbioso e digradante, protetto a nord da scogliere",
      strutture: "Scuola presso il Villaggio Oasi Vieste, noleggio attrezzatura",
      descrizione_tecnica: "Lavora con termiche da nord e sud, moderate e costanti. Baia riparata: principianti/intermedi."
    }
  },
  {
    id: "torre-san-giovanni", name: "Torre San Giovanni", coast: "Ionio", region: "Puglia", disciplines: ["wind", "kite"], lat: 39.8508, lon: 18.3311,
    webcam_banner: { provider: "SkylineWebcams", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/lecce/torre-san-giovanni-ugento.html", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbia bianca fine, bassa, protetta da una fila di isolotti/scogli paralleli alla costa",
      strutture: "Scuola kitesurf/windsurf attiva tutto l'anno (Lega Navale Italiana), gommone di assistenza in estate",
      descrizione_tecnica: "Lavora con Scirocco invernale (15-35 nodi) e termica da Ovest in estate. Acqua piatta: tutti i livelli."
    }
  },
  {
    id: "gallipoli-baia-verde", name: "Gallipoli (Baia Verde)", coast: "Ionio", region: "Puglia", disciplines: ["wind", "kite", "wave"], lat: 40.0389, lon: 17.9836,
    webcam_banner: { provider: "SkylineWebcams", url: "https://www.skylinewebcams.com/it/webcam/italia/puglia/lecce/gallipoli.html", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbioso, spiaggia larga con facile accesso",
      strutture: "Scuola Salento Coast Ovest dal 2004, noleggio presso Ecoresort Le Sirenè",
      descrizione_tecnica: "Lavora con vento da NO a S. Spot cittadino, adatto a principianti in condizioni normali."
    }
  },
  {
    id: "campomarino-curvone", name: "Campomarino di Maruggio (Il Curvone)", coast: "Ionio", region: "Puglia", disciplines: ["wave"], lat: 40.3928, lon: 17.6119,
    webcam_banner: { provider: "Vedetta.org (Torretta Mare)", url: "https://vedetta.org/webcam/italia/puglia/taranto/torretta-mare/", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Roccia/Misto",
      strutture: "Nessuna scuola dedicata; presente il lido Bahia del Sol nella zona adiacente",
      descrizione_tecnica: "Lavora con Scirocco ed Est-Nord-Est. Onde potenti su roccia: livello intermedio/esperto."
    }
  },
  {
    id: "torre-lapillo-punta-prosciutto", name: "Torre Lapillo (Gatto Nero)", coast: "Ionio", region: "Puglia", disciplines: ["kite", "wind"], lat: 40.3167, lon: 17.8667,
    webcam_banner: { provider: "SkylineWebcams (fallback: Porto Cesareo, ~3-5km)", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/lecce/porto-cesareo.html", embed_type: "iframe_redirect", fallback: true, note: "Nessuna webcam dedicata trovata esattamente su Torre Lapillo/Punta Prosciutto." },
    spot_info: {
      fondale: "Sabbia, fondale basso e digradante per 50-70 metri dalla riva",
      strutture: "Scuola kite a 'La Strea' (laguna a sud, acqua piatta), hotel, bar/ristoranti, ampio parcheggio",
      descrizione_tecnica: "Lavora con Maestrale (NW), media ~11 nodi. Principianti vicino riva; laguna ideale per freestyle."
    }
  },
  {
    id: "gallipoli-lido-pizzo", name: "Gallipoli (Lido Pizzo)", coast: "Ionio", region: "Puglia", disciplines: ["kite", "wind"], lat: 40.0667, lon: 17.9833,
    webcam_banner: { provider: "Wind24 (Lido Pizzo)", url: "https://win.wind24.it/gallipoli/webcam/Lido-Pizzo-0022", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Misto — piccola baia sabbiosa con alcune rocce che affiorano vicino alla riva",
      strutture: "Scuola kite Salento Coast Ovest Kitesurf, attiva tutto l'anno",
      descrizione_tecnica: "Lavora con Nord/Nord-Est. Rocce affioranti: livello intermedio/esperto."
    }
  },
  {
    id: "bari-pane-pomodoro", name: "Bari (Pane e Pomodoro)", coast: "Adriatico", region: "Puglia", disciplines: ["kite", "wind"], lat: 41.1256, lon: 16.8719,
    webcam_banner: { provider: "SkylineWebcams", url: "https://www.skylinewebcams.com/en/webcam/italia/puglia/bari/spiaggia-di-bari.html", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbia",
      strutture: "Portale locale TanaOnda dedicato a surf/windsurf/kite in zona; spiaggia cittadina con lungomare",
      descrizione_tecnica: "Spot cittadino, accessibile anche a principianti."
    }
  },
  {
    id: "monopoli-capitolo", name: "Monopoli (Capitolo)", coast: "Adriatico", region: "Puglia", disciplines: ["wind", "kite", "wave"], lat: 40.9333, lon: 17.2667,
    webcam_banner: { provider: "IPCamLive", url: "https://www.ipcamlive.com/64a4267102d72", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Misto sabbia-roccia in gran parte dell'area",
      strutture: "Numerosi lidi attrezzati (noleggio lettini, docce, bar, ristoranti, parcheggio privato)",
      descrizione_tecnica: "Lavora con Tramontana e Grecale. Beach/reef-break tecnico, frequentato anche da rider esperti."
    }
  },
  {
    id: "torre-guaceto", name: "Torre Guaceto", coast: "Adriatico", region: "Puglia", disciplines: ["kite"], lat: 40.7167, lon: 17.8,
    webcam_banner: { provider: "SkylineWebcams (Guna Beach)", url: "https://www.skylinewebcams.com/it/webcam/italia/puglia/brindisi/guna-beach.html", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbia",
      strutture: "Scuola Kite Salento (corsi IKO, noleggio, kite camp), Sporting Club Torre Guaceto, struttura balneare Guna Beach partner",
      descrizione_tecnica: "Lavora da Ovest ed Est, 10-40 nodi. Baia riparata: principianti, ma frequentata anche da esperti."
    }
  },
  {
    id: "frigole", name: "Frigole", coast: "Adriatico", region: "Puglia", disciplines: ["kite", "wind"], lat: 40.4667, lon: 18.2667,
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia",
      strutture: "Spiaggia attrezzata con bar, ristorante, docce, parcheggio gratuito; scuola kite dedicata (Scuola Kite Lecce, area riservata presso il 'Molo Tredici' in estate)",
      descrizione_tecnica: "Lavora con Maestrale/Tramontana, termica da Est con Scirocco. Fondale sabbioso: ottimo per principianti."
    }
  },
  {
    id: "torre-canne", name: "Torre Canne", coast: "Adriatico", region: "Puglia", disciplines: ["wind", "kite", "wave"], lat: 40.8167, lon: 17.4333,
    webcam_banner: { provider: "MeteoTorreCanne", url: "https://meteotorrecanne.it", embed_type: "iframe_redirect", fallback: true, note: "Webcam del porto: potrebbe non essere sempre raggiungibile." },
    spot_info: {
      fondale: "Misto — sabbioso nella zona centrale (Bandiera Blu), più roccioso verso sud in direzione Pilone/Rosa Marina",
      strutture: "SKP – Kitesurf Puglia School attiva; la storica scuola windsurf Birinbau risulta chiusa da alcuni anni",
      descrizione_tecnica: "Lavora con Maestrale (NNW) tutto l'anno, termica da Est in estate. Porto riparato: principianti."
    }
  },
  {
    id: "peschici-baia-manaccora", name: "Peschici (Baia di Manaccora)", coast: "Gargano", region: "Puglia", disciplines: ["wind", "kite"], lat: 41.95, lon: 16.0167,
    webcam_banner: { provider: "Vedetta.org", url: "https://vedetta.org/webcam/italia/puglia/foggia/peschici-manaccora/", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Sabbia fine, con scogliere/promontori rocciosi ai lati della baia",
      strutture: "Villaggio Baia di Manaccora con bar/ristorante, corsi di windsurf e kitesurf",
      descrizione_tecnica: "Lavora con NW e termica SE. Con vento da N onde solo per esperti (baia rocciosa)."
    }
  },
  {
    id: "marina-di-lesina", name: "Marina di Lesina", coast: "Gargano", region: "Puglia", disciplines: ["wind", "kite"], lat: 41.8833, lon: 15.3667,
    webcam_banner: { provider: "Vedetta.org", url: "https://vedetta.org/webcam/italia/puglia/foggia/lesina-comune1/", embed_type: "iframe_redirect", note: "La webcam inquadra il comune/lungomare di Lesina; lo spot kite reale è sul Lago di Lesina, la laguna a sud della marina." },
    spot_info: {
      fondale: "Bacino lacustre salmastro (Lago di Lesina), profondità massima 1,5m, flat water — non è uno spot di mare aperto",
      strutture: "Gargano Lake Kite School con pontile di partenza e servizio di recupero in barca (safety boat)",
      descrizione_tecnica: "Spot reale sul Lago di Lesina (laguna). Lavora con Sud/Sud-Ovest/Ovest, acqua piatta: principianti."
    }
  },
  {
    id: "otranto", name: "Otranto", coast: "Adriatico", region: "Puglia", disciplines: ["wave"], lat: 40.1479, lon: 18.4868,
    webcam_banner: { provider: "SkylineWebcams", url: "https://www.skylinewebcams.com/it/webcam/italia/puglia/lecce/tour-porto-di-otranto.html", embed_type: "iframe_redirect" },
    spot_info: {
      fondale: "Roccia/misto — costa frastagliata nei pressi del centro storico e del porto",
      strutture: "Nessuna scuola dedicata individuata direttamente sul porto; zona turistica con servizi in centro città",
      descrizione_tecnica: "Lavora con Scirocco (SE) e Grecale (NE). Costa rocciosa: livello intermedio/esperto."
    }
  },

  // ==================== SICILIA — TRAPANI, lato Tirreno ====================
  {
    id: "san-vito-lo-capo", name: "San Vito Lo Capo", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1747, lon: 12.7333, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia (beach break)",
      strutture: "Nessuna struttura verificata in questa ricerca — nota come rinomata meta turistica",
      descrizione_tecnica: "Beach break sabbioso. Mareggiate da Ovest."
    }
  },
  {
    id: "cornino", name: "Cornino", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.0975, lon: 12.6944, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onde destre. Mareggiate da Nord-Ovest."
    }
  },
  {
    id: "lido-valderice", name: "Lido Valderice", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.0219, lon: 12.6167, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Mareggiate da Nord-Ovest."
    }
  },
  {
    id: "pizzolungo-il-benzinaio", name: "Pizzolungo (Il Benzinaio)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.0206, lon: 12.5539, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Mareggiate da Nord-Ovest, lavora anche senza vento."
    }
  },
  {
    id: "san-giuliano-trapani", name: "San Giuliano (Trapani)", coast: "Tirreno", region: "Sicilia", disciplines: ["kite"], lat: 38.0247, lon: 12.5044, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Kite da ottobre a marzo. Migliore con Grecale (NE)."
    }
  },
  {
    id: "torre-muzzard", name: "Torre Muzzard (Carini)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.181, lon: 13.162, coordsSource: "surfline",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato — spot con report attivo su Surfline ma senza note raccolte dall'utente",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Dati insufficienti dalle fonti raccolte: solo coordinate e presenza confermate (Surfline), nessun dettaglio su orientamento/tipo di onda oltre al forecast generico."
    }
  },

  // ==================== SICILIA — TRAPANI, lato Canale di Sicilia ====================
  {
    id: "granitola-cala-dei-turchi", name: "Granitola (Cala dei Turchi)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.6139, lon: 12.7361, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso, onda A-frame",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Mareggiate da Nord-Ovest, Ovest, Sud-Ovest."
    }
  },
  {
    id: "granitola-canada-point", name: "Granitola (Canada Point)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.6194, lon: 12.7292, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso, onda A-frame",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Mareggiate da Nord-Ovest, Ovest, Sud-Ovest."
    }
  },
  {
    id: "granitola-faro", name: "Granitola (Faro)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.6139, lon: 12.7361, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso, onda A-frame",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Mareggiate da Nord-Ovest, Ovest, Sud-Ovest."
    }
  },
  {
    id: "puzziteddu", name: "Puzziteddu", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave", "wind"], lat: 37.6394, lon: 12.5794, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda e vento tutto l'anno. Vento migliore da Ovest e Nord-Ovest."
    }
  },
  {
    id: "capo-feto", name: "Capo Feto", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["kite"], lat: 37.6069, lon: 12.5544, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Riserva naturale WWF",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Kite tutto l'anno. Vento migliore da Nord-Ovest."
    }
  },
  {
    id: "biscione-petrosino", name: "Biscione (Petrosino)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave", "kite"], lat: 37.7053, lon: 12.4972, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Sede di una tappa del campionato italiano kite wave",
      descrizione_tecnica: "Onda fino a 4-5m in inverno. Vento da Ovest/Nord-Ovest."
    }
  },
  {
    id: "marausa", name: "Marausa", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["kite"], lat: 37.9294, lon: 12.4761, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Kite da ottobre a maggio. Vento migliore da Nord-Est."
    }
  },
  {
    id: "stagnone-di-marsala", name: "Stagnone di Marsala (Isola di Santa Maria)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["kite"], lat: 37.8722, lon: 12.4694, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Laguna bassa",
      strutture: "Spot kite storico, tappa mondiale di freestyle nel 2013",
      descrizione_tecnica: "Vento da tutte le direzioni oltre 300 giorni l'anno. Acqua piatta, adatto a tutti i livelli."
    }
  },
  {
    id: "playa-bianca-marsala", name: "Playa Bianca (Marsala)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["kite"], lat: 37.7961, lon: 12.4064, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Kite da ottobre a maggio. Vento da Sud/Sud-Ovest/Nord/Nord-Ovest."
    }
  },

  // ==================== SICILIA — PALERMO (tutti Tirreno) ====================
  {
    id: "cefalu-lungomare", name: "Cefalù (Lungomare)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.0389, lon: 14.0231, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Uno dei break ravvicinati di Cefalù. Mareggiate da Nord-Est/Nord/Nord-Ovest."
    }
  },
  {
    id: "cefalu-santa-lucia", name: "Cefalù (Santa Lucia)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.0389, lon: 14.0231, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Uno dei break ravvicinati di Cefalù. Mareggiate da Nord-Est/Nord/Nord-Ovest."
    }
  },
  {
    id: "cefalu-kamikaze", name: "Cefalù (Kamikaze)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.0389, lon: 14.0231, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Uno dei break ravvicinati di Cefalù. Mareggiate da Nord-Est/Nord/Nord-Ovest."
    }
  },
  {
    id: "cefalu-big", name: "Cefalù (Big)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.0389, lon: 14.0231, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Uno dei break ravvicinati di Cefalù. Mareggiate da Nord-Est/Nord/Nord-Ovest."
    }
  },
  {
    id: "cala-rosa-termini-imerese", name: "Cala Rosa (Termini Imerese)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 37.9808, lon: 13.6875, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Mareggiate da Nord/Nord-Ovest."
    }
  },
  {
    id: "san-nicola-larena", name: "San Nicola l'Arena", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.0181, lon: 13.6444, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia (beach break)",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Mareggiate da Nord-Est/Nord/Nord-Ovest, lavora anche senza vento."
    }
  },
  {
    id: "mondello-moletto", name: "Mondello (Moletto)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1961, lon: 13.3308, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia",
      strutture: "Nessuna struttura verificata in questa ricerca — nota spiaggia cittadina di Palermo",
      descrizione_tecnica: "Uno dei break ravvicinati di Mondello. Mareggiate da Nord/Nord-Ovest."
    }
  },
  {
    id: "mondello-alabaria", name: "Mondello (Alabaria)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1961, lon: 13.3308, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia",
      strutture: "Nessuna struttura verificata in questa ricerca — nota spiaggia cittadina di Palermo",
      descrizione_tecnica: "Uno dei break ravvicinati di Mondello. Mareggiate da Nord/Nord-Ovest."
    }
  },
  {
    id: "mondello-baretto", name: "Mondello (Baretto)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1961, lon: 13.3308, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia",
      strutture: "Nessuna struttura verificata in questa ricerca — nota spiaggia cittadina di Palermo",
      descrizione_tecnica: "Uno dei break ravvicinati di Mondello. Mareggiate da Nord/Nord-Ovest."
    }
  },
  {
    id: "mondello-stabilimento", name: "Mondello (Stabilimento)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1961, lon: 13.3308, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia",
      strutture: "Nessuna struttura verificata in questa ricerca — nota spiaggia cittadina di Palermo",
      descrizione_tecnica: "Uno dei break ravvicinati di Mondello. Mareggiate da Nord/Nord-Ovest."
    }
  },
  {
    id: "isola-delle-femmine", name: "Isola delle Femmine", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.2, lon: 13.25, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Segnalato da TheSurfAtlas come il miglior spot surf della Sicilia. Mareggiate da Nord-Ovest."
    }
  },
  {
    id: "capaci-millenium", name: "Capaci (Millenium)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1783, lon: 13.235, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Piccole mareggiate da Nord-Ovest."
    }
  },
  {
    id: "punta-raisi-la-trappola", name: "Punta Raisi (La Trappola)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1811, lon: 13.1, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Roccia (point break)",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Mareggiate da Nord-Ovest."
    }
  },
  {
    id: "punta-raisi-la-tonnara", name: "Punta Raisi (La Tonnara)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1811, lon: 13.1, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Roccia (point break)",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Mareggiate da Nord-Ovest. Vento offshore quando lo spot è attivo."
    }
  },
  {
    id: "cinisi-il-reef", name: "Cinisi (Il Reef)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1667, lon: 13.09, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Mareggiate da Sud-Ovest/Nord-Ovest."
    }
  },
  {
    id: "cinisi-magaggiari", name: "Cinisi (Magaggiari)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1667, lon: 13.09, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Mareggiate da Sud-Ovest/Nord-Ovest."
    }
  },
  {
    id: "praiola-terrasini", name: "Praiola (Terrasini)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.15, lon: 13.0833, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia (beach break)",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda destra. Piccole mareggiate da Nord-Ovest, tiene bene la dimensione dell'onda."
    }
  },
  {
    id: "ciammarita-trappeto", name: "Ciammarita (Trappeto)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1319, lon: 13.0658, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia (beach break)",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Mareggiate da Nord-Ovest, tiene bene la dimensione dell'onda."
    }
  },

  // ==================== SICILIA — AGRIGENTO (Canale di Sicilia) ====================
  {
    id: "giallonardo", name: "Giallonardo", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave", "wind"], lat: 37.2917, lon: 13.4694, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sand bank",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Grosse mareggiate da Sud-Est con vento forte."
    }
  },
  {
    id: "sciacca-san-marco", name: "Sciacca (San Marco)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.5069, lon: 13.0872, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Mareggiate da Sud-Ovest/Sud-Est."
    }
  },
  {
    id: "sciacca-ciminiera", name: "Sciacca (Ciminiera)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.5069, lon: 13.0872, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Mareggiate da Sud-Ovest/Sud-Est."
    }
  },
  {
    id: "san-leone-il-reef", name: "San Leone (Il Reef)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.2833, lon: 13.5806, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Uno dei break ravvicinati di San Leone. Mareggiate da Est/Sud-Est/Sud/Sud-Ovest."
    }
  },
  {
    id: "san-leone-la-baietta", name: "San Leone (La Baietta)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.2833, lon: 13.5806, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sand bank",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Uno dei break ravvicinati di San Leone. Mareggiate da Est/Sud-Est/Sud/Sud-Ovest."
    }
  },
  {
    id: "san-leone-langolino", name: "San Leone (L'Angolino)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.2833, lon: 13.5806, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Uno dei break ravvicinati di San Leone. Mareggiate da Est/Sud-Est/Sud/Sud-Ovest."
    }
  },
  {
    id: "san-leone-il-kaos", name: "San Leone (Il Kaos)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.2833, lon: 13.5806, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Uno dei break ravvicinati di San Leone. Mareggiate da Est/Sud-Est/Sud/Sud-Ovest."
    }
  },
  {
    id: "san-leone-ponente", name: "San Leone (Ponente)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.232, lon: 13.621, coordsSource: "surfline",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato — spot con report attivo su Surfline ma senza note raccolte dall'utente",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Dati insufficienti dalle fonti raccolte: quinto break della zona di San Leone Mosè (comune confermato da Surfline), nessun dettaglio su orientamento/tipo di onda oltre al forecast generico."
    }
  },
  {
    id: "backdoor", name: "Backdoor (Siculiana)", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 37.333, lon: 13.393, coordsSource: "surfline",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato — spot con report attivo su Surfline ma senza note raccolte dall'utente",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Dati insufficienti dalle fonti raccolte: solo coordinate e presenza confermate (Surfline, comune di Siculiana), nessun dettaglio su orientamento/tipo di onda oltre al forecast generico."
    }
  },

  // ==================== SICILIA — RAGUSA (Canale di Sicilia) ====================
  {
    id: "marina-di-modica", name: "Marina di Modica", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 36.7644, lon: 14.7772, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sand bank",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Mareggiate da Nord-Ovest/Ovest, lavora anche con vento forte."
    }
  },
  {
    id: "punta-braccetto", name: "Punta Braccetto", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["wave"], lat: 36.8106, lon: 14.4653, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato — citato da Surfline, dettagli da verificare",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Dati insufficienti dalle fonti raccolte."
    }
  },
  {
    id: "santa-maria-del-focallo", name: "Santa Maria del Focallo", coast: "Canale di Sicilia", region: "Sicilia", disciplines: ["kite"], lat: 36.6931, lon: 14.8494, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato nelle fonti raccolte",
      strutture: "Sicily Kite School",
      descrizione_tecnica: "Spot kite segnalato dalla scuola locale Sicily Kite School."
    }
  },

  // ==================== SICILIA — SIRACUSA ====================
  {
    id: "portopalo", name: "Portopalo (di Capo Passero)", coast: "Ionio", region: "Sicilia", disciplines: ["wind", "wave"], lat: 36.6828, lon: 15.1319, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Punta esposta",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Windsurf per esperti. Forti mareggiate invernali, onde anche da medicane. Sulla punta di Capo Passero: classificazione costa Ionio/Canale di Sicilia arbitraria (vedi nota in testa al file)."
    }
  },
  {
    id: "il-reef-dellisola", name: "Il Reef Dell'Isola (Torrefano)", coast: "Ionio", region: "Sicilia", disciplines: ["wave"], lat: 36.6511, lon: 15.0759, coordsSource: "surfline",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Dati insufficienti dalle fonti raccolte: solo coordinate e presenza confermate (Surfline, comune di Torrefano, vicino Portopalo/Capo Passero). Stessa nota di classificazione costa di Portopalo."
    }
  },
  {
    id: "siracusa-south", name: "Siracusa South (Punta Milocca)", coast: "Ionio", region: "Sicilia", disciplines: ["wave"], lat: 36.95, lon: 15.18, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato — accesso da Punta Milocca",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda destra A-frame. Uno dei break più impegnativi dell'isola. Mareggiate da Sud-Ovest."
    }
  },
  {
    id: "morghella", name: "Morghella", coast: "Ionio", region: "Sicilia", disciplines: ["wave"], lat: 36.6764, lon: 15.1189, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato — citato da Surfline, dettagli da verificare",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Dati insufficienti dalle fonti raccolte."
    }
  },
  {
    id: "baia-arcile", name: "Baia Arcile", coast: "Ionio", region: "Sicilia", disciplines: ["wave"], lat: 36.8931, lon: 15.1614, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Non specificato — citato da Surfline, dettagli da verificare",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Dati insufficienti dalle fonti raccolte."
    }
  },

  // ==================== SICILIA — CATANIA (Ionio) ====================
  {
    id: "catania-la-playa", name: "Catania (La Playa)", coast: "Ionio", region: "Sicilia", disciplines: ["wave", "kite"], lat: 37.4739, lon: 15.0794, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia (beach break)",
      strutture: "Sicily Kite School (kite termico in zona)",
      descrizione_tecnica: "Include anche Spiaggia della Plaia (stesso lungomare). Mareggiate da Sud-Est/Est/Nord-Est, offshore con vento da ovest. Kite termico con vento da Nord/Nord-Est."
    }
  },
  {
    id: "catania-le-capannine", name: "Catania (Le Capannine)", coast: "Ionio", region: "Sicilia", disciplines: ["wave"], lat: 37.4739, lon: 15.0794, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Sabbia (beach break)",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Stesso litorale di Catania (La Playa). Mareggiate da Sud-Est/Est/Nord-Est, offshore con vento da ovest."
    }
  },
  {
    id: "acitrezza-i-faraglioni", name: "Acitrezza (I Faraglioni)", coast: "Ionio", region: "Sicilia", disciplines: ["wave"], lat: 37.5619, lon: 15.1594, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Roccia (point break)",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Unico point break su roccia dell'isola. Mareggiate da Sud-Est/Est/Nord-Est."
    }
  },

  // ==================== SICILIA — MESSINA ====================
  {
    id: "giardini-naxos", name: "Giardini Naxos", coast: "Ionio", region: "Sicilia", disciplines: ["wave"], lat: 37.8306, lon: 15.2661, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Misto — sabbia con reef sinistro davanti alla chiesa (attivo con grandi mareggiate)",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Mareggiate da Nord-Est/Est/Sud-Est. La sinistra su reef è rara."
    }
  },
  {
    id: "acqualadrone-il-fiume", name: "Acqualadrone (Il Fiume)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.2214, lon: 15.5178, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef di ciottoli",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Mareggiate da Ovest/Nord-Ovest, lavora anche con vento."
    }
  },
  {
    id: "villafranca-tarantonio", name: "Villafranca (Tarantonio)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.2667, lon: 15.4167, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Misto — sabbia e roccia",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Grosse mareggiate da Nord-Ovest senza vento."
    }
  },
  {
    id: "tindari-mongiove", name: "Tindari (Mongiove)", coast: "Tirreno", region: "Sicilia", disciplines: ["wave"], lat: 38.1394, lon: 15.0472, coordsSource: "estimate",
    webcam_banner: null,
    spot_info: {
      fondale: "Reef roccioso",
      strutture: "Nessuna struttura verificata in questa ricerca",
      descrizione_tecnica: "Onda sinistra. Mareggiate da Nord-Ovest, lavora anche con vento leggero."
    }
  },
];

module.exports = SPOTS;
