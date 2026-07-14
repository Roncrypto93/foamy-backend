/**
 * marineService.js
 * - fetchOpenMeteoMarine: chiamata reale all'API Marine di Open-Meteo
 *   (modello ECMWF WAM), che restituisce altezza/periodo/direzione onda.
 * - fetchCopernicusMarine: chiamata reale al Copernicus Marine Service (CMEMS)
 *   tramite il Copernicus Marine Toolbox ufficiale. Il toolbox è Python-only
 *   (è l'unico metodo di accesso programmatico supportato da Copernicus), quindi
 *   invochiamo scripts/fetch_copernicus_wave.py come sottoprocesso e ne
 *   parsiamo l'output JSON.
 *
 * Requisiti runtime per Copernicus:
 *   - python3 nel PATH del server
 *   - `pip install copernicusmarine`
 *   - credenziali salvate con `copernicusmarine login` sulla macchina che
 *     esegue il backend (oppure env COPERNICUSMARINE_SERVICE_USERNAME/_PASSWORD)
 */

const { spawn } = require("child_process");
const path = require("path");

const BASE_URL =
  process.env.OPEN_METEO_MARINE_URL || "https://marine-api.open-meteo.com/v1/marine";

const COPERNICUS_SCRIPT = path.join(__dirname, "fetch_copernicus_wave.py");
const COPERNICUS_TIMEOUT_MS = Number(process.env.COPERNICUS_TIMEOUT_MS) || 20000;
const COPERNICUS_DATASET_ID = process.env.COPERNICUS_DATASET_ID; // opzionale, override del default nello script
const PYTHON_BIN = process.env.PYTHON_BIN || "python3";

/**
 * Recupera il forecast mare (onda) da Open-Meteo, modello ECMWF.
 * @param {number} lat
 * @param {number} lon
 */
async function fetchOpenMeteoMarine(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: "wave_height,wave_period,wave_direction",
    timezone: "Europe/Rome",
    models: "ecmwf_wam025,best_match",
    forecast_days: 1,
  });

  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `[marineService] Errore Open-Meteo marine (${response.status}): ${await response.text()}`
    );
  }

  const data = await response.json();
  const idx = 0;
  const hourly = data.hourly || {};

  return {
    source: "open-meteo-ecmwf",
    waveHeightM: roundTo(hourly.wave_height?.[idx], 2),
    wavePeriodS: roundTo(hourly.wave_period?.[idx], 1),
    waveDirectionDeg: roundTo(hourly.wave_direction?.[idx], 0),
    timestamp: hourly.time?.[idx] ?? new Date().toISOString(),
  };
}

/**
 * Recupera altezza/periodo/direzione onda reali da Copernicus Marine Service
 * per il punto lat/lon, invocando il Toolbox Python come sottoprocesso.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{source: string, waveHeightM: number|null, wavePeriodS: number|null, waveDirectionDeg: number|null, timestamp: string}>}
 */
function fetchCopernicusMarine(lat, lon) {
  return new Promise((resolve, reject) => {
    const args = [COPERNICUS_SCRIPT, String(lat), String(lon)];
    if (COPERNICUS_DATASET_ID) {
      args.push("--dataset-id", COPERNICUS_DATASET_ID);
    }

    const child = spawn(PYTHON_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(
        new Error(
          `[marineService] Timeout (${COPERNICUS_TIMEOUT_MS}ms) in attesa di Copernicus Marine per (${lat}, ${lon})`
        )
      );
    }, COPERNICUS_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`[marineService] Impossibile avviare ${PYTHON_BIN}: ${err.message}`));
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (!stdout.trim()) {
        return reject(
          new Error(
            `[marineService] Nessun output da fetch_copernicus_wave.py (exit ${code}). stderr: ${stderr.slice(0, 500)}`
          )
        );
      }

      let parsed;
      try {
        parsed = JSON.parse(stdout.trim());
      } catch (e) {
        return reject(
          new Error(`[marineService] Output non-JSON da Copernicus script: ${stdout.slice(0, 500)}`)
        );
      }

      if (parsed.error) {
        return reject(new Error(`[marineService] Copernicus Marine error (${parsed.error}): ${parsed.message}`));
      }

      resolve(parsed);
    });
  });
}

function roundTo(value, decimals) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

module.exports = { fetchOpenMeteoMarine, fetchCopernicusMarine };
