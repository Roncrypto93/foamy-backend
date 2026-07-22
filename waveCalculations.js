/**
 * waveCalculations.js
 * Logica di "data cleaning" e calcolo fisico derivato per il modulo mare.
 */

/**
 * Calcola la media tra il dato Open-Meteo (ECMWF) e quello Copernicus Marine
 * (CMEMS, dato reale) per altezza e periodo onda. Per la direzione, dà
 * priorità al dato Copernicus come richiesto dal brief.
 */
function mergeMarineData(openMeteoData, copernicusData) {
  const avg = (a, b) => {
    if (a === null && b === null) return null;
    if (a === null) return b;
    if (b === null) return a;
    return roundTo((a + b) / 2, 2);
  };

  const waveHeightM = avg(openMeteoData.waveHeightM, copernicusData.waveHeightM);
  const wavePeriodS = avg(openMeteoData.wavePeriodS, copernicusData.wavePeriodS);

  // Priorità a Copernicus per la direzione; fallback su Open-Meteo se assente.
  const waveDirectionDeg =
    copernicusData.waveDirectionDeg !== null
      ? copernicusData.waveDirectionDeg
      : openMeteoData.waveDirectionDeg;

  return { waveHeightM, wavePeriodS, waveDirectionDeg };
}

/**
 * Calcola l'energia dell'onda stimata in kJ.
 * Formula: Energia = (Altezza^2) * Periodo * 10 (arrotondata a intero).
 *
 * Nota fisica: non è la formula oceanografica reale del flusso di
 * energia (che userebbe densità dell'acqua e gravità, dando numeri in
 * kW/m a una cifra — es. ~3.5 kW/m per un'onda 1.2m/5s). È un indice
 * comparabile "in stile Surf-Forecast", tarato per allinearsi ai numeri
 * che i surfisti già vedono su altre piattaforme: confrontato punto per
 * punto con i valori orari mostrati da surf-forecast.com per lo stesso
 * spot, questa costante (10, non 5) riproduce i loro numeri quasi esatti.
 */
function calculateWaveEnergyKJ(waveHeightM, wavePeriodS) {
  if (waveHeightM === null || wavePeriodS === null) return null;
  const energy = waveHeightM ** 2 * wavePeriodS * 10;
  return Math.round(energy);
}

/**
 * Mappa l'altezza dell'onda sulla Scala Douglas (versione semplificata
 * a 5 livelli come da specifica del brief).
 */
function getDouglasSeaState(waveHeightM) {
  if (waveHeightM === null || waveHeightM === undefined) return "N/D";
  if (waveHeightM < 0.1) return "Forza 1 - Quasi Calmo";
  if (waveHeightM < 0.5) return "Forza 2 - Poco Mosso";
  if (waveHeightM < 1.25) return "Forza 3 - Mosso";
  if (waveHeightM < 2.5) return "Forza 4 - Molto Mosso";
  return "Forza 5 - Agitato";
}

function roundTo(value, decimals) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Livelli in ordine crescente di qualità — l'indice determina bump/tetto.
const SURF_RATING_LEVELS = ["Scarsa", "Discreta", "Buona", "Ottima", "Perfetto"];

// Tabella base altezza onda × periodo, calibrata sul Mediterraneo (non la
// logica oceanica standard tipo Surfline: qui 7s è già periodo "alto", il
// Mediterraneo raramente supera 9-10s). Fasce: limite superiore escluso,
// limite inferiore incluso — es. 0.5m cade nella riga "0.5-0.8m", non
// "0.3-0.5m"; 5.5s cade in "5.5-7s", non "4-5.5s".
const SURF_RATING_BASE_TABLE = [
  // <4s          4-5.5s      5.5-7s      7-9s          >9s
  ["Scarsa", "Scarsa", "Scarsa", "Discreta", "Buona"], // <0.3m
  ["Scarsa", "Scarsa", "Discreta", "Buona", "Buona"], // 0.3-0.5m
  ["Scarsa", "Discreta", "Buona", "Ottima", "Ottima"], // 0.5-0.8m
  ["Discreta", "Buona", "Ottima", "Ottima", "Ottima"], // 0.8-1.2m
  ["Discreta", "Buona", "Ottima", "Ottima", "Ottima"], // >1.2m
];

function surfHeightRowIndex(waveHeightM) {
  if (waveHeightM < 0.3) return 0;
  if (waveHeightM < 0.5) return 1;
  if (waveHeightM < 0.8) return 2;
  if (waveHeightM < 1.2) return 3;
  return 4;
}

function surfPeriodColIndex(wavePeriodS) {
  if (wavePeriodS < 4) return 0;
  if (wavePeriodS < 5.5) return 1;
  if (wavePeriodS < 7) return 2;
  if (wavePeriodS < 9) return 3;
  return 4;
}

function bumpSurfLevel(level) {
  const idx = SURF_RATING_LEVELS.indexOf(level);
  return SURF_RATING_LEVELS[Math.min(idx + 1, SURF_RATING_LEVELS.length - 1)];
}

// Non un tetto fisso ("mai sopra Buona") ma un declassamento di una
// posizione dal livello base — corretto dopo un caso reale (Otranto,
// vento onshore >15kn su base già "Buona": col vecchio tetto non
// succedeva nulla, che non è il comportamento voluto).
function downgradeSurfLevel(level) {
  const idx = SURF_RATING_LEVELS.indexOf(level);
  return SURF_RATING_LEVELS[Math.max(idx - 1, 0)];
}

// Differenza angolare firmata tra due direzioni (0-360°), normalizzata in
// (-180°, 180°] — serve per capire da che lato e di quanto un vento si
// discosta dalla perpendicolare offshore, indipendentemente da eventuali
// giri completi (es. 350° vs 10° sono vicini, non lontani 340°).
function angularDiff(a, b) {
  let diff = (a - b) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

// Zona del vento rispetto alla costa (4 spicchi da 90°, simmetrici sui due
// lati rispetto alla perpendicolare offshore) e la categoria di modifica
// che ne deriva — non ancora applicata al livello base, solo la
// classificazione grezza secondo la calibrazione del brief.
function surfWindZoneEffect(windDirectionDeg, windSpeedKn, coastOrientationDeg) {
  if (windSpeedKn < 5) return "bump"; // qualsiasi direzione, vento calmo

  const offshoreDeg = (coastOrientationDeg + 180) % 360;
  const delta = Math.abs(angularDiff(windDirectionDeg, offshoreDeg));

  if (delta <= 45) return "bump"; // offshore, qualsiasi intensità >=5kn
  if (delta <= 90) return windSpeedKn <= 15 ? "bump" : "none"; // cross-offshore
  return windSpeedKn <= 15 ? "none" : "cap"; // cross-onshore / onshore (90°-180°)
}

/**
 * Punteggio qualità condizioni SOLO per il surf (kite/windsurf hanno una
 * logica diversa, fuori scope) — formula calibrata sul Mediterraneo, non
 * la logica oceanica standard (es. Surfline). Vedi le tabelle/funzioni
 * sopra per la tabella base e le zone vento.
 *
 * Non lancia mai un'eccezione:
 * - se manca altezza o periodo onda, non c'è punteggio possibile:
 *   { rating: null, baseLevel: null, windEffect: "unavailable" }.
 * - se manca vento (direzione/velocità) o coastOrientationDeg dello spot,
 *   salta i passi 2-3 e ritorna solo il livello base:
 *   { rating: baseLevel, baseLevel, windEffect: "unavailable" }.
 *
 * "Scarsa" non viene mai modificata da bump/declassamento (resta sempre
 * Scarsa) e "Perfetto" si raggiunge solo tramite bump, mai dalla tabella
 * base da sola (il valore massimo in tabella è "Ottima"). Vento onshore/
 * cross-onshore >15kn declassa il livello base di UNA posizione (non un
 * tetto fisso a "Buona": un livello base già a "Buona" o sotto viene
 * comunque abbassato di uno, non lasciato invariato). `windEffect`
 * riflette l'effetto REALMENTE applicato al rating finale, non solo la
 * categoria teorica della zona vento: se "Scarsa" blocca un bump teorico,
 * il valore riportato è "none" — non "bump" — per evitare che un
 * consumatore a valle (es. un badge "vento favorevole" in UI) mostri un
 * effetto che in realtà non ha cambiato nulla.
 */
function calculateSurfRating(waveHeightM, wavePeriodS, windSpeedKn, windDirectionDeg, coastOrientationDeg) {
  if (waveHeightM == null || wavePeriodS == null) {
    return { rating: null, baseLevel: null, windEffect: "unavailable" };
  }

  const baseLevel = SURF_RATING_BASE_TABLE[surfHeightRowIndex(waveHeightM)][surfPeriodColIndex(wavePeriodS)];

  if (windSpeedKn == null || windDirectionDeg == null || coastOrientationDeg == null) {
    return { rating: baseLevel, baseLevel, windEffect: "unavailable" };
  }

  const zoneEffect = surfWindZoneEffect(windDirectionDeg, windSpeedKn, coastOrientationDeg);

  let rating = baseLevel;
  let windEffect = "none";
  if (baseLevel !== "Scarsa") {
    if (zoneEffect === "bump") {
      rating = bumpSurfLevel(baseLevel);
      windEffect = "bump";
    } else if (zoneEffect === "cap") {
      const downgraded = downgradeSurfLevel(baseLevel);
      if (downgraded !== baseLevel) {
        rating = downgraded;
        windEffect = "cap";
      }
    }
  }

  return { rating, baseLevel, windEffect };
}

module.exports = {
  mergeMarineData,
  calculateWaveEnergyKJ,
  getDouglasSeaState,
  calculateSurfRating,
};
