/**
 * forecastCache.js
 * Cache a due livelli per i forecast (condizioni attuali e /daily):
 *
 * 1. In-memory (node-cache) — velocissima, ma azzerata ad ogni riavvio.
 * 2. Upstash Redis (REST, persistente) — sopravvive ai riavvii: sul piano
 *    free di Render l'istanza si addormenta dopo 15 minuti di inattività
 *    e perde tutto lo stato in-memory, quindi senza un livello persistente
 *    la cache locale da sola non basta a stare dentro la quota gratuita
 *    giornaliera di Open-Meteo.
 *
 * TTL 180 minuti di default: un utente che richiede lo stesso spot entro
 * questa finestra riceve il dato salvato invece di far scattare una nuova
 * chiamata a Open-Meteo/Copernicus.
 *
 * Se UPSTASH_REDIS_REST_URL/TOKEN non sono configurate, o se Upstash non
 * risponde, si degrada con grazia sulla sola cache in-memory (stesso
 * comportamento di prima) — non fa mai fallire la richiesta dell'utente.
 */

const NodeCache = require("node-cache");

const TTL_SECONDS = Number(process.env.FORECAST_CACHE_TTL) || 10800; // 180 minuti
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const UPSTASH_TIMEOUT_MS = Number(process.env.UPSTASH_TIMEOUT_MS) || 5000;

const upstashEnabled = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

const localCache = new NodeCache({ stdTTL: TTL_SECONDS });

async function upstashCommand(command) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTASH_TIMEOUT_MS);
  try {
    const res = await fetch(UPSTASH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Upstash HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return data.result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Legge una chiave: prima la cache locale (istantanea), poi Upstash se la
 * locale non ce l'ha (es. istanza appena riavviata). Un hit su Upstash
 * riscalda anche la cache locale, così le richieste successive nella
 * stessa finestra di attività non toccano più la rete.
 */
async function get(key) {
  const local = localCache.get(key);
  if (local !== undefined) return local;

  if (!upstashEnabled) return undefined;
  try {
    const raw = await upstashCommand(["GET", key]);
    if (!raw) return undefined;
    const value = JSON.parse(raw);
    localCache.set(key, value);
    return value;
  } catch (err) {
    console.warn(`[forecastCache] Upstash GET fallita per "${key}":`, err.message);
    return undefined;
  }
}

/**
 * Scrive su entrambi i livelli. Un fallimento su Upstash non blocca la
 * risposta. `ttlSeconds` è opzionale: alcuni dati (es. temperatura acqua,
 * marea) vogliono una finestra diversa dai 180 minuti standard del forecast.
 */
async function set(key, value, ttlSeconds) {
  const ttl = ttlSeconds || TTL_SECONDS;
  localCache.set(key, value, ttl);
  if (!upstashEnabled) return;
  try {
    await upstashCommand(["SET", key, JSON.stringify(value), "EX", String(ttl)]);
  } catch (err) {
    console.warn(`[forecastCache] Upstash SET fallita per "${key}":`, err.message);
  }
}

module.exports = { get, set, TTL_SECONDS, upstashEnabled };
