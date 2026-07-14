/**
 * Database mock degli spot Puglia per l'MVP di Foamy.
 * In produzione questa struttura andrà migrata su un DB reale
 * (es. PostgreSQL + PostGIS per query geospaziali), ma l'MVP
 * usa un array statico in-memory per semplicità e velocità di iterazione.
 *
 * 19 spot (Frassanito e Alimini sono due spot distinti — spiagge separate
 * lungo la costa, anche se vicine e spesso citate insieme nelle guide).
 *
 * Campi:
 * - id: slug univoco usato come :spotId nelle route
 * - name: nome visualizzato
 * - coast: "Adriatico" | "Ionio" | "Gargano"
 * - disciplines: array tra ["wave", "wind", "kite"]
 * - lat/lon: coordinate usate per interrogare Open-Meteo
 * - webcam_banner: struttura dedicata al banner webcam live.
 *   ATTENZIONE: gli url sono placeholder plausibili basati sui network
 *   citati nel brief (SkylineWebcams, Eolo, 365giorniinvisb, Vedetta.org,
 *   scuole locali). Vanno verificati/sostituiti con i link reali e attivi
 *   prima del rilascio, perché la disponibilità delle webcam cambia nel tempo.
 */

const SPOTS = [
  {
    id: "san-foca",
    name: "San Foca (Li Marangi)",
    coast: "Adriatico",
    disciplines: ["wave", "kite"],
    lat: 40.3283,
    lon: 18.3639,
    webcam_banner: {
      provider: "SkylineWebcams",
      url: "https://www.skylinewebcams.com/it/webcam/italia/puglia/lecce/san-foca.html",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "torre-dellorso",
    name: "Torre dell'Orso",
    coast: "Adriatico",
    disciplines: ["wave"],
    lat: 40.2717,
    lon: 18.4235,
    webcam_banner: {
      provider: "Eolo",
      url: "https://www.eolo.it/webcam/torre-dellorso",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "frassanito",
    name: "Frassanito",
    coast: "Adriatico",
    disciplines: ["wind", "kite", "wave"],
    lat: 40.2261,
    lon: 18.4584,
    webcam_banner: {
      provider: "SkylineWebcams",
      url: "https://www.skylinewebcams.com/it/webcam/italia/puglia/lecce/spiaggia-di-frassanito-alimini.html",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "alimini",
    name: "Alimini",
    coast: "Adriatico",
    disciplines: ["wind", "kite", "wave"],
    lat: 40.2519,
    lon: 18.4506,
    webcam_banner: {
      provider: "Scuola Locale (Kite/Wind School Alimini)",
      url: "https://www.aliminikite.it/webcam-live",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "rosamarina-ostuni",
    name: "Rosamarina di Ostuni",
    coast: "Adriatico",
    disciplines: ["wave", "wind"],
    lat: 40.7333,
    lon: 17.6667,
    webcam_banner: {
      provider: "365giorniinvisb",
      url: "https://www.365giorniinvisb.it/webcam/rosa-marina-ostuni",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "porto-cesareo-reef",
    name: "Porto Cesareo (Il Reef)",
    coast: "Ionio",
    disciplines: ["wave", "wind", "kite"],
    lat: 40.2606,
    lon: 17.8994,
    webcam_banner: {
      provider: "Vedetta.org",
      url: "https://www.vedetta.org/webcam/porto-cesareo",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "vieste-scialmarino",
    name: "Vieste (Spiaggia di Scialmarino)",
    coast: "Gargano",
    disciplines: ["wind", "kite"],
    lat: 41.9036,
    lon: 16.144,
    webcam_banner: {
      provider: "SkylineWebcams",
      url: "https://www.skylinewebcams.com/it/webcam/italia/puglia/foggia/vieste.html",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "torre-san-giovanni",
    name: "Torre San Giovanni",
    coast: "Ionio",
    disciplines: ["wind", "kite"],
    lat: 39.8508,
    lon: 18.3311,
    webcam_banner: {
      provider: "Scuola Locale (Torre San Giovanni Kite Club)",
      url: "https://www.tsgkiteclub.it/webcam",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "gallipoli-baia-verde",
    name: "Gallipoli (Baia Verde)",
    coast: "Ionio",
    disciplines: ["wind", "kite", "wave"],
    lat: 40.0389,
    lon: 17.9836,
    webcam_banner: {
      provider: "SkylineWebcams",
      url: "https://www.skylinewebcams.com/it/webcam/italia/puglia/lecce/gallipoli.html",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "campomarino-curvone",
    name: "Campomarino di Maruggio (Il Curvone)",
    coast: "Ionio",
    disciplines: ["wave"],
    lat: 40.3928,
    lon: 17.6119,
    webcam_banner: {
      provider: "Eolo",
      url: "https://www.eolo.it/webcam/campomarino-curvone",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "torre-lapillo-punta-prosciutto",
    name: "Torre Lapillo / Punta Prosciutto",
    coast: "Ionio",
    disciplines: ["kite", "wind"],
    lat: 40.3167,
    lon: 17.8667,
    webcam_banner: {
      provider: "Vedetta.org",
      url: "https://www.vedetta.org/webcam/punta-prosciutto",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "gallipoli-lido-pizzo",
    name: "Gallipoli (Lido Pizzo)",
    coast: "Ionio",
    disciplines: ["kite", "wind"],
    lat: 40.0667,
    lon: 17.9833,
    webcam_banner: {
      provider: "Scuola Locale (Lido Pizzo Kite Spot)",
      url: "https://www.lidopizzokite.it/webcam",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "bari-pane-pomodoro",
    name: "Bari (Pane e Pomodoro)",
    coast: "Adriatico",
    disciplines: ["kite", "wind"],
    lat: 41.1256,
    lon: 16.8719,
    webcam_banner: {
      provider: "SkylineWebcams",
      url: "https://www.skylinewebcams.com/it/webcam/italia/puglia/bari/bari.html",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "monopoli-capitolo",
    name: "Monopoli (Capitolo)",
    coast: "Adriatico",
    disciplines: ["wind", "kite", "wave"],
    lat: 40.9333,
    lon: 17.2667,
    webcam_banner: {
      provider: "365giorniinvisb",
      url: "https://www.365giorniinvisb.it/webcam/monopoli-capitolo",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "torre-guaceto",
    name: "Torre Guaceto",
    coast: "Adriatico",
    disciplines: ["kite"],
    lat: 40.7167,
    lon: 17.8,
    webcam_banner: {
      provider: "Vedetta.org",
      url: "https://www.vedetta.org/webcam/torre-guaceto",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "frigole",
    name: "Frigole",
    coast: "Adriatico",
    disciplines: ["kite", "wind"],
    lat: 40.4667,
    lon: 18.2667,
    webcam_banner: {
      provider: "Eolo",
      url: "https://www.eolo.it/webcam/frigole",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "torre-canne",
    name: "Torre Canne",
    coast: "Adriatico",
    disciplines: ["wind", "kite", "wave"],
    lat: 40.8167,
    lon: 17.4333,
    webcam_banner: {
      provider: "SkylineWebcams",
      url: "https://www.skylinewebcams.com/it/webcam/italia/puglia/brindisi/torre-canne.html",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "peschici-baia-manaccora",
    name: "Peschici (Baia di Manaccora)",
    coast: "Gargano",
    disciplines: ["wind", "kite"],
    lat: 41.95,
    lon: 16.0167,
    webcam_banner: {
      provider: "Eolo",
      url: "https://www.eolo.it/webcam/peschici-manaccora",
      embed_type: "iframe_redirect",
    },
  },
  {
    id: "marina-di-lesina",
    name: "Marina di Lesina",
    coast: "Gargano",
    disciplines: ["wind", "kite"],
    lat: 41.8833,
    lon: 15.3667,
    webcam_banner: {
      provider: "Scuola Locale (Lesina Kite/Wind Club)",
      url: "https://www.lesinakiteclub.it/webcam",
      embed_type: "iframe_redirect",
    },
  },
];

module.exports = SPOTS;
