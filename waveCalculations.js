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
 * Formula da specifica: Energia = 0.5 * (Altezza^2) * Periodo * 10
 * (arrotondata a intero).
 *
 * Nota fisica: questa è una formula semplificata "in stile Surf-Forecast"
 * per dare un indice comparabile di potenza dell'onda, non la formula
 * oceanografica completa del flusso di energia (che include densità
 * dell'acqua e gravità). La implementiamo esattamente come da brief.
 */
function calculateWaveEnergyKJ(waveHeightM, wavePeriodS) {
  if (waveHeightM === null || wavePeriodS === null) return null;
  const energy = 0.5 * waveHeightM ** 2 * wavePeriodS * 10;
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

module.exports = { mergeMarineData, calculateWaveEnergyKJ, getDouglasSeaState };
