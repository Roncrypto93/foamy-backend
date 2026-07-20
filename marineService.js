/**
 * marineService.js
 * Interroga l'endpoint /v1/marine di Open-Meteo (modello ECMWF) per
 * altezza, periodo e direzione dell'onda.
 *
 * Stessi due bug corretti qui che erano in weatherService.js:
 * 1) Un solo modello per chiamata (niente suffissi nei nomi dei campi).
 * 2) Indice orario basato sull'ora locale corrente, non sempre mezzanotte.
 */

const BASE_URL =
  process.env.OPEN_METEO_MARINE_URL || "https://marine-api.open-meteo.com/v1/marine";

const TIMEZONE = "Europe/Rome";
// swell_wave_period (non wave_period) per il periodo: è la media calcolata
// sulla sola componente swell, non annacquata dal mare da vento mescolato
// dentro la media combinata di wave_period. Vedi commento su energyFrom
// lato frontend per il ragionamento completo.
const HOURLY_VARS = "wave_height,swell_wave_period,wave_direction";

async function fetchModel(lat, lon, model) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: HOURLY_VARS,
    timezone: TIMEZONE,
    models: model,
    forecast_days: 1,
  });

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `[marineService] Errore Open-Meteo marine (${response.status}) per modello ${model}: ${await response.text()}`
    );
  }

  return response.json();
}

function hasUsableWaveData(data) {
  const arr = data?.hourly?.wave_height;
  return Array.isArray(arr) && arr.some((v) => v !== null && v !== undefined);
}

function getCurrentHourIndex(timezone) {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date())
    .find((p) => p.type === "hour").value;

  let hour = parseInt(hourStr, 10);
  if (hour === 24) hour = 0;
  return hour;
}

async function fetchOpenMeteoMarine(lat, lon) {
  let data = await fetchModel(lat, lon, "ecmwf_wam025");
  let modelUsed = "ecmwf_wam025";

  if (!hasUsableWaveData(data)) {
    data = await fetchModel(lat, lon, "best_match");
    modelUsed = "best_match";
  }

  const idx = getCurrentHourIndex(TIMEZONE);
  const hourly = data.hourly || {};
  const lastIdx = (hourly.wave_height?.length || 1) - 1;
  const safeIdx = Math.min(idx, Math.max(lastIdx, 0));

  return {
    source: modelUsed,
    waveHeightM: roundTo(hourly.wave_height?.[safeIdx], 2),
    wavePeriodS: roundTo(hourly.swell_wave_period?.[safeIdx], 1),
    waveDirectionDeg: roundTo(hourly.wave_direction?.[safeIdx], 0),
    timestamp: hourly.time?.[safeIdx] ?? new Date().toISOString(),
  };
}

/**
 * Copernicus Marine non è ancora attivo su questo deploy (richiede Python,
 * non presente sull'ambiente Node di Render). Restituiamo un risultato
 * "vuoto" così il merge in forecast.controller.js ricade correttamente
 * sul solo dato Open-Meteo/ECMWF sopra.
 */
async function fetchCopernicusMarine() {
  throw new Error("Copernicus Marine non configurato su questo deploy (richiede Python).");
}

function roundTo(value, decimals) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

module.exports = { fetchOpenMeteoMarine, fetchCopernicusMarine };
