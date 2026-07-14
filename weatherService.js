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

function
