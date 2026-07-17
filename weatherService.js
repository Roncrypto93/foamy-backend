/**
 * weatherService.js
 * Interroga l'endpoint /v1/forecast di Open-Meteo per ottenere il vento,
 * cercando di replicare il tipo di dato che mostra Windguru (modello ad
 * alta risoluzione, nodi, aggiornamento orario).
 */

const BASE_URL =
  process.env.OPEN_METEO_FORECAST_URL || "https://api.open-meteo.com/v1/forecast";

const TIMEZONE = "Europe/Rome";
const HOURLY_VARS = "wind_speed_10m,wind_gusts_10m,wind_direction_10m";

// Le raffiche vengono da GFS invece che da ICON: confronto diretto sul
// campo (luglio 2026, es. 17.1kn ICON vs 12.2kn GFS nello stesso istante)
// ha mostrato che le raffiche ICON risultano sistematicamente più alte di
// quelle di Windguru, che usa GFS — taratura allineata su richiesta.
// Velocità e direzione restano dal modello principale (ICON-EU), su cui è
// tarata la correzione manuale con l'anemometro.
const GUST_MODEL = process.env.WIND_GUST_MODEL || "gfs_seamless";

// Con più modelli nella stessa chiamata, Open-Meteo suffissa i campi orari
// con il nome del modello (es. wind_speed_10m_icon_eu).
async function fetchModel(lat, lon, model) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: HOURLY_VARS,
    wind_speed_unit: "kn",
    timezone: TIMEZONE,
    models: `${model},${GUST_MODEL}`,
    forecast_days: 1,
  });

  const url = `${BASE_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `[weatherService] Errore Open-Meteo forecast (${response.status}) per modello ${model}: ${await response.text()}`
    );
  }

  return response.json();
}

function hasUsableWindData(data, model) {
  const arr = data?.hourly?.[`wind_speed_10m_${model}`];
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

async function fetchWindForecast(lat, lon) {
  let modelUsed = "icon_eu";
  let data = await fetchModel(lat, lon, modelUsed);

  if (!hasUsableWindData(data, modelUsed)) {
    modelUsed = "best_match";
    data = await fetchModel(lat, lon, modelUsed);
  }

  const idx = getCurrentHourIndex(TIMEZONE);
  const hourly = data.hourly || {};

  const lastIdx = (hourly[`wind_speed_10m_${modelUsed}`]?.length || 1) - 1;
  const safeIdx = Math.min(idx, Math.max(lastIdx, 0));

  // Raffiche da GFS quando disponibili; se GFS non copre il punto/l'ora
  // (es. fuori griglia), si ricade sulle raffiche del modello principale.
  const gusts =
    hourly[`wind_gusts_10m_${GUST_MODEL}`]?.[safeIdx] ??
    hourly[`wind_gusts_10m_${modelUsed}`]?.[safeIdx];

  return {
    windSpeedKn: roundTo(hourly[`wind_speed_10m_${modelUsed}`]?.[safeIdx], 1),
    windGustsKn: roundTo(gusts, 1),
    windDirectionDeg: roundTo(hourly[`wind_direction_10m_${modelUsed}`]?.[safeIdx], 0),
    timestamp: hourly.time?.[safeIdx] ?? new Date().toISOString(),
    modelUsed,
  };
}

function roundTo(value, decimals) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

module.exports = { fetchWindForecast, getCurrentHourIndex };
