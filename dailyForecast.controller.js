/**
 * dailyForecast.controller.js
 * GET /api/forecast/:spotId/daily — forecast a 3 giorni, calcolando
 * energia onda e scala Douglas per ciascun giorno con le stesse formule
 * usate per le condizioni attuali. Cache separata dalle condizioni attuali.
 */

const NodeCache = require("node-cache");
const SPOTS = require("./spots");
const { fetchThreeDayForecast } = require("./dailyMarineService");
const { calculateWaveEnergyKJ, getDouglasSeaState } = require("./waveCalculations");

const cache = new NodeCache({
  stdTTL: Number(process.env.FORECAST_CACHE_TTL) || 900,
});

async function getDailyForecastBySpotId(req, res) {
  const { spotId } = req.params;

  const spot = SPOTS.find((s) => s.id === spotId);
  if (!spot) {
    return res.status(404).json({
      error: "SPOT_NOT_FOUND",
      message: `Nessuno spot trovato con id "${spotId}".`,
    });
  }

  const cacheKey = `daily:${spotId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, cache: true });
  }

  try {
    const days = await fetchThreeDayForecast(spot.lat, spot.lon);

    const payload = {
      spot: { id: spot.id, name: spot.name, coast: spot.coast },
      days: days.map((d) => ({
        date: d.date,
        wind: {
          speedKn: d.windSpeedKn,
          gustsKn: d.windGustsKn,
          directionDeg: d.windDirectionDeg,
        },
        sea: {
          waveHeightM: d.sea.waveHeightM,
          wavePeriodS: d.sea.wavePeriodS,
          waveDirectionDeg: d.sea.waveDirectionDeg,
          waveEnergyKJ: calculateWaveEnergyKJ(d.sea.waveHeightM, d.sea.wavePeriodS),
          seaState: getDouglasSeaState(d.sea.waveHeightM),
          source: d.sea.source,
          copernicusDegraded: d.copernicusDegraded,
          copernicusError: d.copernicusError,
        },
      })),
      generatedAt: new Date().toISOString(),
      cache: false,
    };

    cache.set(cacheKey, payload);
    return res.json(payload);
  } catch (err) {
    console.error(`[dailyForecast.controller] Errore per spot ${spotId}:`, err);
    return res.status(502).json({
      error: "UPSTREAM_API_ERROR",
      message: "Errore nel recupero del forecast a 3 giorni dalle API esterne.",
      detail: err.message,
    });
  }
}

module.exports = { getDailyForecastBySpotId };
