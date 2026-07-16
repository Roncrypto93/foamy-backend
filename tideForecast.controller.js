/**
 * tideForecast.controller.js
 * GET /api/forecast/:spotId/tide — marea (Copernicus Marine SSH) e
 * temperatura dell'acqua (Open-Meteo Marine). Il caching (finestre diverse
 * per i due dati) vive dentro tideService.js, non qui: a differenza di
 * forecast.controller.js e dailyForecast.controller.js non c'è un unico
 * cache-wrap a livello di endpoint.
 *
 * Nomi dei campi in risposta in snake_case (spot_id, water_temp,
 * current_level, hourly_forecast) invece del camelCase usato nel resto
 * dell'API: scelta intenzionale per questo endpoint, come da specifica.
 */

const SPOTS = require("./spots");
const { fetchTideAndWaterTemp } = require("./tideService");

async function getTideBySpotId(req, res) {
  const { spotId } = req.params;

  const spot = SPOTS.find((s) => s.id === spotId);
  if (!spot) {
    return res.status(404).json({
      error: "SPOT_NOT_FOUND",
      message: `Nessuno spot trovato con id "${spotId}".`,
    });
  }

  try {
    const { waterTemp, hourly, currentLevel, trend } = await fetchTideAndWaterTemp(spot.id, spot.lat, spot.lon);

    return res.json({
      spot_id: spot.id,
      water_temp: waterTemp,
      tide: {
        current_level: currentLevel,
        trend,
        hourly_forecast: hourly.map((p) => ({ time: p.time, level: p.level })),
      },
    });
  } catch (err) {
    console.error(`[tideForecast.controller] Errore per spot ${spotId}:`, err);
    return res.status(502).json({
      error: "UPSTREAM_API_ERROR",
      message: "Errore nel recupero di marea e temperatura acqua.",
      detail: err.message,
    });
  }
}

module.exports = { getTideBySpotId };
