/**
 * weatherService.js
 * Interroga l'endpoint /v1/forecast di Open-Meteo per ottenere vento.
 * Richiediamo i modelli ad alta risoluzione ICON-EU / AROME (Meteo-France)
 * tramite il parametro `models`, così da avvicinarci alla granularità
 * che Windguru offre per lo stesso tipo di previsione locale.
 *
 * Docs: https://open-meteo.com/en/docs
 */

const BASE_URL =
  process.env.OPEN_METEO_FORECAST_URL || "https://api.open-meteo.com/v1/forecast";

/**
 * Recupera il forecast vento per una coppia di coordinate.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{windSpeedKn: number, windGustsKn: number, windDirectionDeg: number, timestamp: string}>}
 */
async function fetchWindForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: "wind_speed_10m,wind_gusts_10m,wind_direction_10m",
    wind_speed_unit: "kn", // nodi, richiesto dalle specifiche
    timezone: "Europe/Rome",
    // Fallback a "best_match" se ICON-EU/AROME non coprono l'area esatta;
    // Open-Meteo seleziona automaticamente il miglior modello disponibile
    // per lat/lon quando si passa questa lista.
    models: "icon_eu,meteofrance_arome_france_hd,best_match",
    forecast_days: 1,
  });

  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `[weatherService] Errore Open-Meteo forecast (${response.status}): ${await response.text()}`
    );
  }

  const data = await response.json();

  // Prendiamo il primo orario disponibile "prossimo" (indice 0) come
  // snapshot corrente. In una versione futura si potrebbe restituire
  // l'intera serie oraria per costruire un grafico multi-day come Windguru.
  const idx = 0;
  const hourly = data.hourly || {};

  return {
    windSpeedKn: roundTo(hourly.wind_speed_10m?.[idx], 1),
    windGustsKn: roundTo(hourly.wind_gusts_10m?.[idx], 1),
    windDirectionDeg: roundTo(hourly.wind_direction_10m?.[idx], 0),
    timestamp: hourly.time?.[idx] ?? new Date().toISOString(),
    modelUsed: data.generationtime_ms !== undefined ? "open-meteo (icon_eu/arome/best_match)" : "unknown",
  };
}

function roundTo(value, decimals) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

module.exports = { fetchWindForecast };
