/**
 * dailyMarineService.js
 * Dati per il forecast a 3 giorni (endpoint /api/forecast/:spotId/daily).
 * Non tocca weatherService.js / marineService.js: quelli restano
 * invariati e continuano ad alimentare solo le condizioni attuali.
 *
 * Per il mare, ogni giorno viene interrogato su foamy-copernicus (dataset
 * CMEMS anfc, che copre alcuni giorni di forecast reale) passando ?date=.
 * Se il servizio non risponde per un giorno, si degrada sul massimo
 * giornaliero ECMWF di Open-Meteo per quello stesso giorno.
 */

const OPEN_METEO_FORECAST_URL =
  process.env.OPEN_METEO_FORECAST_URL || "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_MARINE_URL =
  process.env.OPEN_METEO_MARINE_URL || "https://marine-api.open-meteo.com/v1/marine";
const COPERNICUS_SERVICE_URL = process.env.COPERNICUS_SERVICE_URL || "http://localhost:5000";
// Timeout più permissivo di quello del subprocess Python (COPERNICUS_TIMEOUT_MS):
// ogni chiamata a foamy-copernicus riapre un dataset CMEMS da zero, ed è lento
// specialmente su hosting free-tier a risorse limitate.
const COPERNICUS_DAILY_TIMEOUT_MS = Number(process.env.COPERNICUS_DAILY_TIMEOUT_MS) || 45000;
const TIMEZONE = "Europe/Rome";
const FORECAST_DAYS = 3;

async function fetchWindDaily(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: "wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant",
    wind_speed_unit: "kn",
    timezone: TIMEZONE,
    forecast_days: FORECAST_DAYS,
  });
  const res = await fetch(`${OPEN_METEO_FORECAST_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`[dailyMarineService] Errore Open-Meteo forecast daily (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function fetchMarineDaily(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: "wave_height_max,wave_period_max,wave_direction_dominant",
    timezone: TIMEZONE,
    forecast_days: FORECAST_DAYS,
  });
  const res = await fetch(`${OPEN_METEO_MARINE_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`[dailyMarineService] Errore Open-Meteo marine daily (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function fetchCopernicusForDate(lat, lon, dateStr) {
  const params = new URLSearchParams({ lat, lon, date: dateStr });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COPERNICUS_DAILY_TIMEOUT_MS);
  try {
    const res = await fetch(`${COPERNICUS_SERVICE_URL}/wave?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`[dailyMarineService] Errore foamy-copernicus (${res.status}) per ${dateStr}`);
    }
    const data = await res.json();
    return {
      waveHeightM: roundTo(data.waveHeightM, 2),
      wavePeriodS: roundTo(data.wavePeriodS, 1),
      waveDirectionDeg: roundTo(data.waveDirectionDeg, 0),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Restituisce il forecast a 3 giorni: vento sempre da Open-Meteo, mare da
 * Copernicus reale dove disponibile. Le chiamate a Copernicus sono
 * sequenziali (non in parallelo): ogni richiesta riapre un dataset CMEMS,
 * costoso su un'istanza free-tier — farne 3 insieme le rallenta tutte fino
 * a farle scadere in timeout. Un giorno fallito non abbatte gli altri.
 */
async function fetchThreeDayForecast(lat, lon) {
  const [wind, ecmwfMarine] = await Promise.all([fetchWindDaily(lat, lon), fetchMarineDaily(lat, lon)]);

  const dates = wind.daily.time;
  const copernicusResults = [];
  for (const date of dates) {
    try {
      copernicusResults.push({ status: "fulfilled", value: await fetchCopernicusForDate(lat, lon, date) });
    } catch (err) {
      copernicusResults.push({ status: "rejected", reason: err });
    }
  }

  return dates.map((date, i) => {
    const ecmwfHeight = ecmwfMarine?.daily?.wave_height_max?.[i] ?? null;
    const ecmwfPeriod = ecmwfMarine?.daily?.wave_period_max?.[i] ?? null;
    const ecmwfDirection = ecmwfMarine?.daily?.wave_direction_dominant?.[i] ?? null;

    const copernicus = copernicusResults[i];
    const copernicusDegraded = copernicus.status !== "fulfilled";
    const sea = copernicusDegraded
      ? { waveHeightM: ecmwfHeight, wavePeriodS: ecmwfPeriod, waveDirectionDeg: ecmwfDirection, source: "open-meteo-ecmwf" }
      : { ...copernicus.value, source: "copernicus-marine-cmems" };

    if (copernicusDegraded) {
      console.warn(`[dailyMarineService] Copernicus fallito per ${date} (${lat},${lon}):`, copernicus.reason?.message);
    }

    return {
      date,
      windSpeedKn: wind.daily.wind_speed_10m_max[i],
      windGustsKn: wind.daily.wind_gusts_10m_max[i],
      windDirectionDeg: wind.daily.wind_direction_10m_dominant[i],
      sea,
      copernicusDegraded,
    };
  });
}

function roundTo(value, decimals) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

module.exports = { fetchThreeDayForecast };
