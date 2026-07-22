/**
 * dailyForecast.controller.js
 * GET /api/forecast/:spotId/daily — forecast settimanale (7 giorni),
 * calcolando energia onda e scala Douglas per ciascun giorno con le stesse
 * formule usate per le condizioni attuali. Usa la stessa cache condivisa
 * (forecastCache.js) delle condizioni attuali, ma con una chiave diversa
 * ("daily:" invece di "forecast:"), quindi le due restano indipendenti.
 */

const SPOTS = require("./spots");
const { fetchWeeklyForecast } = require("./dailyMarineService");
const { calculateWaveEnergyKJ, getDouglasSeaState, calculateSurfRating } = require("./waveCalculations");
const forecastCache = require("./forecastCache");

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
  const cached = await forecastCache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, cache: true });
  }

  try {
    const { days, chart, windChart } = await fetchWeeklyForecast(spot.lat, spot.lon);

    // Punteggio surf SOLO per gli spot che fanno surf (kite/windsurf fuori
    // scope), stessa condizione già usata in forecast.controller.js.
    const isWaveSpot = spot.disciplines.includes("wave");

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
          ...(isWaveSpot
            ? { surfRating: calculateSurfRating(d.sea.waveHeightM, d.sea.wavePeriodS, d.windSpeedKn, d.windDirectionDeg, spot.coastOrientationDeg) }
            : {}),
          source: d.sea.source,
          copernicusDegraded: d.copernicusDegraded,
          waterTempC: d.sea.waterTempC,
          seaLevelM: d.sea.seaLevelM,
        },
      })),
      // Serie a step di 3 ore (56 punti sui 7 giorni) per il grafico "Onda
      // Idrodinamica": sempre da Open-Meteo/ECMWF, non da Copernicus (vedi
      // nota in dailyMarineService.js sul perché non è praticabile a questa
      // risoluzione sul free-tier). windChart[i] è allineato per indice a
      // chart[i] (stessa griglia oraria a step di 3, stesso timezone e
      // forecast_days sia per vento che per mare), serve per il punteggio
      // surf punto per punto.
      chart: chart.map((p, i) => ({
        time: p.time,
        waveHeightM: p.waveHeightM,
        wavePeriodS: p.wavePeriodS,
        // Mancava dalla risposta pur essendo già calcolata a monte in
        // dailyMarineService.js: le frecce di direzione sul grafico onda
        // non avevano mai il dato in produzione.
        waveDirectionDeg: p.waveDirectionDeg,
        waveEnergyKJ: calculateWaveEnergyKJ(p.waveHeightM, p.wavePeriodS),
        ...(isWaveSpot
          ? { surfRating: calculateSurfRating(p.waveHeightM, p.wavePeriodS, windChart[i]?.windSpeedKn, windChart[i]?.windDirectionDeg, spot.coastOrientationDeg) }
          : {}),
      })),
      // Stessa risoluzione a 3 ore del grafico onde, per il grafico vento a
      // barre colorate per intensità.
      windChart: windChart.map((p) => ({
        time: p.time,
        windSpeedKn: p.windSpeedKn,
        windGustsKn: p.windGustsKn,
        windDirectionDeg: p.windDirectionDeg,
      })),
      generatedAt: new Date().toISOString(),
      cache: false,
    };

    await forecastCache.set(cacheKey, payload);
    return res.json(payload);
  } catch (err) {
    console.error(`[dailyForecast.controller] Errore per spot ${spotId}:`, err);
    return res.status(502).json({
      error: "UPSTREAM_API_ERROR",
      message: "Errore nel recupero del forecast settimanale dalle API esterne.",
      detail: err.message,
    });
  }
}

module.exports = { getDailyForecastBySpotId };
