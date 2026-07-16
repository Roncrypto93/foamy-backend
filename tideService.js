/**
 * tideService.js
 * Marea (Copernicus Marine SSH, dataset fisico del Mediterraneo) e
 * temperatura dell'acqua (Open-Meteo Marine) per l'endpoint
 * GET /api/forecast/:spotId/tide.
 *
 * Cache dedicata, non quella condivisa forecast/daily: qui i due dati
 * hanno finestre di refresh diverse, quindi non possono condividere un
 * unico TTL a livello di endpoint come fanno forecast.controller.js e
 * dailyForecast.controller.js.
 * - Temperatura dell'acqua: cambia lentamente, aggiornata al massimo ogni
 *   12 ore (WATER_TEMP_CACHE_TTL).
 * - Marea: scaricata una volta al giorno per spot (l'intero forecast
 *   orario della giornata), non ad ogni richiesta. Non è un vero cron: la
 *   chiave di cache include la data del giorno (Europe/Rome), quindi la
 *   prima richiesta dopo la mezzanotte locale la rigenera da sola — stesso
 *   effetto pratico di un refresh notturno, senza bisogno di un processo
 *   sempre attivo (che su Render free tier, con lo sleep dopo 15 min di
 *   inattività, non sarebbe comunque affidabile).
 */

const OPEN_METEO_MARINE_URL =
  process.env.OPEN_METEO_MARINE_URL || "https://marine-api.open-meteo.com/v1/marine";
const COPERNICUS_SERVICE_URL = process.env.COPERNICUS_SERVICE_URL || "http://localhost:5000";
const COPERNICUS_TIDE_TIMEOUT_MS = Number(process.env.COPERNICUS_TIDE_TIMEOUT_MS) || 45000;
const TIMEZONE = "Europe/Rome";

const WATER_TEMP_CACHE_TTL = Number(process.env.WATER_TEMP_CACHE_TTL) || 43200; // 12 ore
const TIDE_CACHE_TTL = Number(process.env.TIDE_CACHE_TTL) || 93600; // 26 ore (margine oltre il giorno)

const forecastCache = require("./forecastCache");

// Data di calendario Europe/Rome in formato YYYY-MM-DD: allinea la chiave
// di cache al giorno percepito dall'utente, non a UTC.
function todayDateStr() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

// L'ora corrente Europe/Rome (0-23): foamy-copernicus restituisce già gli
// orari della marea convertiti in questo stesso fuso, quindi non serve
// nessuna conversione qui per confrontarli.
function getCurrentHour() {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date())
    .find((p) => p.type === "hour").value;
  let hour = parseInt(hourStr, 10);
  if (hour === 24) hour = 0;
  return hour;
}

async function fetchWaterTemp(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: "sea_surface_temperature",
    timezone: TIMEZONE,
    forecast_days: 1,
  });
  const res = await fetch(`${OPEN_METEO_MARINE_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`[tideService] Errore Open-Meteo marine (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const hourly = data.hourly || {};
  const lastIdx = (hourly.time?.length || 1) - 1;
  const idx = Math.min(getCurrentHour(), Math.max(lastIdx, 0));
  return roundTo(hourly.sea_surface_temperature?.[idx], 1);
}

async function fetchTideHourly(lat, lon, dateStr) {
  const params = new URLSearchParams({ lat, lon, date: dateStr });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COPERNICUS_TIDE_TIMEOUT_MS);
  try {
    const res = await fetch(`${COPERNICUS_SERVICE_URL}/tide?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`[tideService] Errore foamy-copernicus (${res.status}) per ${dateStr}`);
    }
    const data = await res.json();
    return Array.isArray(data.hourly) ? data.hourly : [];
  } finally {
    clearTimeout(timer);
  }
}

async function getOrFetch(key, fetchFn, ttl) {
  const cached = await forecastCache.get(key);
  if (cached !== undefined) return cached;
  const fresh = await fetchFn();
  await forecastCache.set(key, fresh, ttl);
  return fresh;
}

/**
 * Livello corrente e trend: confronta l'ora corrente con l'ora precedente
 * disponibile (se manca, es. a mezzanotte, confronta con la successiva).
 */
function computeCurrentLevelAndTrend(hourly, nowHour = getCurrentHour()) {
  if (!hourly.length) return { currentLevel: null, trend: null };

  const idx = hourly.findIndex((p) => Number(p.time.slice(0, 2)) === nowHour);
  const currentIdx = idx === -1 ? 0 : idx;
  const current = hourly[currentIdx];

  const prev = hourly[currentIdx - 1];
  const next = hourly[currentIdx + 1];
  let trend = "rising";
  if (prev) {
    trend = current.level >= prev.level ? "rising" : "falling";
  } else if (next) {
    trend = next.level >= current.level ? "rising" : "falling";
  }

  return { currentLevel: current.level, trend };
}

async function fetchTideAndWaterTemp(spotId, lat, lon) {
  const dateStr = todayDateStr();
  const waterTempKey = `watertemp:${spotId}`;
  const tideKey = `tide:${spotId}:${dateStr}`;

  const [waterTempResult, tideResult] = await Promise.allSettled([
    getOrFetch(waterTempKey, () => fetchWaterTemp(lat, lon), WATER_TEMP_CACHE_TTL),
    getOrFetch(tideKey, () => fetchTideHourly(lat, lon, dateStr), TIDE_CACHE_TTL),
  ]);

  let waterTemp = null;
  if (waterTempResult.status === "fulfilled") {
    waterTemp = waterTempResult.value;
  } else {
    console.warn(`[tideService] Temperatura acqua non disponibile per ${spotId}:`, waterTempResult.reason?.message);
  }

  let hourly = [];
  if (tideResult.status === "fulfilled") {
    hourly = tideResult.value;
  } else {
    console.warn(`[tideService] Marea non disponibile per ${spotId}:`, tideResult.reason?.message);
  }

  const { currentLevel, trend } = computeCurrentLevelAndTrend(hourly);

  return { waterTemp, hourly, currentLevel, trend, date: dateStr };
}

function roundTo(value, decimals) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

module.exports = { fetchTideAndWaterTemp, computeCurrentLevelAndTrend };
