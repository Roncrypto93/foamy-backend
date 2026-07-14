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

async function fetchModel(lat, lon, model) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: HOURLY_VARS,
    wind_speed_unit: "kn",
    timezone: TIMEZONE,
    models: model,
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

function hasUsableWindData(data) {
  const arr = data?.hourly?.wind_speed_10m;
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
  let data = await fetchModel(lat, lon, "icon_eu");
  let modelUsed = "icon_eu";

  if (!hasUsableWindData(data)) {
    data = await fetchModel(lat, lon, "best_match");
    modelUsed = "best_match";
  }

  const idx = getCurrentHourIndex(TIMEZONE);
  const hourly = data.hourly || {};

  const lastIdx = (hourly.wind_speed_10m?.length || 1) - 1;
  const safeIdx = Math.min(idx, Math.max(lastIdx, 0));

  return {
    windSpeedKn: roundTo(hourly.wind_speed_10m?.[safeIdx], 1),
    windGustsKn: roundTo(hourly.wind_gusts_10m?.[safeIdx], 1),
    windDirectionDeg: roundTo(hourly.wind_direction_10m?.[safeIdx], 0),
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
