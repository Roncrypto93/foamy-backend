/**
 * dailyMarineService.js
 * Dati per il forecast settimanale (endpoint /api/forecast/:spotId/daily).
 * Non tocca weatherService.js / marineService.js: quelli restano
 * invariati e continuano ad alimentare solo le condizioni attuali.
 *
 * Per il mare, i primi COPERNICUS_REAL_DAYS giorni vengono interrogati su
 * foamy-copernicus (dataset CMEMS anfc, che copre fino a 10 giorni di
 * forecast reale) passando ?date=. Oltre quel limite si usa direttamente il
 * massimo giornaliero ECMWF di Open-Meteo, senza nemmeno tentare Copernicus:
 * ogni chiamata a foamy-copernicus impiega 15-45s sul free-tier ed è
 * sequenziale (il parallelo sovraccarica l'istanza), quindi farlo per tutti
 * e 7 i giorni porterebbe il caso peggiore a ~5 minuti. 3 giorni di dato
 * reale (oggi/domani/dopodomani, quello che conta di più) restano un
 * compromesso ragionevole; i restanti degradano su ECMWF, già segnalato
 * come `copernicusDegraded`. Se non risponde entro il timeout, anche un
 * giorno nei primi 3 degrada allo stesso modo.
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
const FORECAST_DAYS = 7;
const COPERNICUS_REAL_DAYS = Number(process.env.COPERNICUS_REAL_DAYS) || 3;

// Stessa taratura raffiche di weatherService.js: raffiche da GFS (il
// modello di Windguru, sistematicamente più basso di ICON su questo dato),
// velocità/direzione dal modello principale. Con due modelli nella stessa
// chiamata Open-Meteo suffissa tutti i campi con il nome del modello.
const WIND_MODEL = "best_match";
const GUST_MODEL = process.env.WIND_GUST_MODEL || "gfs_seamless";

async function fetchWindDaily(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: "wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant",
    hourly: "wind_speed_10m,wind_gusts_10m,wind_direction_10m",
    wind_speed_unit: "kn",
    timezone: TIMEZONE,
    forecast_days: FORECAST_DAYS,
    models: `${WIND_MODEL},${GUST_MODEL}`,
  });
  const res = await fetch(`${OPEN_METEO_FORECAST_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`[dailyMarineService] Errore Open-Meteo forecast daily (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// Punti ogni 3 ore per il grafico vento a barre: stessa chiamata già usata
// per i massimi giornalieri, nessun costo aggiuntivo.
function buildWindChartSeries(wind) {
  const hourly = wind?.hourly;
  if (!hourly?.time) return [];
  const points = [];
  for (let i = 0; i < hourly.time.length; i += 3) {
    const speed = hourly[`wind_speed_10m_${WIND_MODEL}`]?.[i];
    const rawGusts = hourly[`wind_gusts_10m_${GUST_MODEL}`]?.[i] ?? hourly[`wind_gusts_10m_${WIND_MODEL}`]?.[i];
    points.push({
      time: hourly.time[i],
      windSpeedKn: roundTo(speed, 1),
      windGustsKn: roundTo(gustFloor(rawGusts, speed), 1),
      windDirectionDeg: roundTo(hourly[`wind_direction_10m_${WIND_MODEL}`]?.[i], 0),
    });
  }
  return points;
}

// Un'unica chiamata all'endpoint Marine di Open-Meteo per onde (aggregato
// giornaliero + serie oraria), temperatura superficiale del mare e livello
// del mare (sea_level_height_msl, il proxy più vicino alla marea astronomica
// che Open-Meteo espone: include marea + effetto barometro inverso + altro).
// La serie oraria di wave_height/wave_period alimenta anche il grafico a
// step di 3 ore (vedi buildChartSeries): Copernicus reale non è praticabile
// a questa risoluzione (56 chiamate da fino a 45s ciascuna sul free-tier
// sarebbero troppo lente), quindi il grafico usa lo stesso ECMWF affidabile
// già in uso per temperatura/marea. I valori di riepilogo giornaliero in
// `days` restano invece da Copernicus reale per i primi COPERNICUS_REAL_DAYS
// giorni.
async function fetchMarineDaily(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: "wave_height_max,wave_period_max,wave_direction_dominant",
    hourly: "wave_height,wave_period,sea_surface_temperature,sea_level_height_msl",
    timezone: TIMEZONE,
    forecast_days: FORECAST_DAYS,
  });
  const res = await fetch(`${OPEN_METEO_MARINE_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`[dailyMarineService] Errore Open-Meteo marine daily (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

function middayValue(hourly, variable, date) {
  if (!hourly?.time) return null;
  const idx = hourly.time.indexOf(`${date}T12:00`);
  if (idx === -1) return null;
  return hourly[variable]?.[idx] ?? null;
}

// Punti ogni 3 ore (step richiesto) per il grafico "Onda Idrodinamica":
// altezza onda + periodo, dalla stessa serie oraria ECMWF già scaricata.
function buildChartSeries(ecmwfMarine) {
  const hourly = ecmwfMarine?.hourly;
  if (!hourly?.time) return [];
  const points = [];
  for (let i = 0; i < hourly.time.length; i += 3) {
    points.push({
      time: hourly.time[i],
      waveHeightM: roundTo(hourly.wave_height?.[i], 2),
      wavePeriodS: roundTo(hourly.wave_period?.[i], 1),
    });
  }
  return points;
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
 * Restituisce il forecast settimanale: vento sempre da Open-Meteo, mare da
 * Copernicus reale per i primi COPERNICUS_REAL_DAYS giorni (dove disponibile),
 * ECMWF per il resto. Le chiamate a Copernicus sono sequenziali (non in
 * parallelo): ogni richiesta riapre un dataset CMEMS, costoso su un'istanza
 * free-tier — farne più insieme le rallenta tutte fino a farle scadere in
 * timeout. Un giorno fallito non abbatte gli altri.
 */
async function fetchWeeklyForecast(lat, lon) {
  const [wind, ecmwfMarine] = await Promise.all([fetchWindDaily(lat, lon), fetchMarineDaily(lat, lon)]);
  const chart = buildChartSeries(ecmwfMarine);
  const windChart = buildWindChartSeries(wind);

  const dates = wind.daily.time;
  const copernicusResults = [];
  for (let i = 0; i < dates.length; i++) {
    if (i >= COPERNICUS_REAL_DAYS) {
      copernicusResults.push({ status: "skipped" });
      continue;
    }
    try {
      copernicusResults.push({ status: "fulfilled", value: await fetchCopernicusForDate(lat, lon, dates[i]) });
    } catch (err) {
      copernicusResults.push({ status: "rejected", reason: err });
    }
  }

  const days = dates.map((date, i) => {
    const ecmwfHeight = ecmwfMarine?.daily?.wave_height_max?.[i] ?? null;
    const ecmwfPeriod = ecmwfMarine?.daily?.wave_period_max?.[i] ?? null;
    const ecmwfDirection = ecmwfMarine?.daily?.wave_direction_dominant?.[i] ?? null;

    const copernicus = copernicusResults[i];
    const copernicusDegraded = copernicus.status !== "fulfilled";
    const sea = copernicusDegraded
      ? { waveHeightM: ecmwfHeight, wavePeriodS: ecmwfPeriod, waveDirectionDeg: ecmwfDirection, source: "open-meteo-ecmwf" }
      : { ...copernicus.value, source: "copernicus-marine-cmems" };

    // Temperatura mare e livello del mare: Copernicus (dataset onde CMEMS)
    // non li fornisce, quindi vengono sempre da Open-Meteo, indipendentemente
    // dalla fonte scelta sopra per altezza/periodo/direzione onda.
    sea.waterTempC = roundTo(middayValue(ecmwfMarine.hourly, "sea_surface_temperature", date), 1);
    sea.seaLevelM = roundTo(middayValue(ecmwfMarine.hourly, "sea_level_height_msl", date), 2);

    if (copernicus.status === "rejected") {
      console.warn(`[dailyMarineService] Copernicus fallito per ${date} (${lat},${lon}):`, copernicus.reason?.message);
    }

    const windSpeedKn = wind.daily[`wind_speed_10m_max_${WIND_MODEL}`][i];
    const rawGustsKn =
      wind.daily[`wind_gusts_10m_max_${GUST_MODEL}`]?.[i] ??
      wind.daily[`wind_gusts_10m_max_${WIND_MODEL}`]?.[i];

    return {
      date,
      windSpeedKn,
      windGustsKn: gustFloor(rawGustsKn, windSpeedKn),
      windDirectionDeg: wind.daily[`wind_direction_10m_dominant_${WIND_MODEL}`][i],
      sea,
      copernicusDegraded,
    };
  });

  return { days, chart, windChart };
}

function roundTo(value, decimals) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Una raffica non può mai essere fisicamente più bassa della velocità
// media: incrociare due modelli diversi (velocità da ICON/best_match,
// raffiche da GFS) può romperlo, visto che ogni modello è coerente solo al
// proprio interno, non tra loro. Pavimento: se il modello delle raffiche
// stima meno della velocità mostrata, si tiene la velocità come minimo.
function gustFloor(gusts, speed) {
  if (gusts === undefined || gusts === null) return speed;
  if (speed === undefined || speed === null) return gusts;
  return Math.max(gusts, speed);
}

module.exports = { fetchWeeklyForecast };
