const express = require("express");
const { getForecastBySpotId } = require("./forecast.controller");
const { getDailyForecastBySpotId } = require("./dailyForecast.controller");
const { getTideBySpotId } = require("./tideForecast.controller");

const router = express.Router();

/**
 * GET /api/forecast/:spotId
 * Esegue fetch vento+mare, calcoli di media, energia onda (kJ),
 * scala Douglas, e restituisce il JSON pulito comprensivo di webcam banner.
 */
router.get("/:spotId", getForecastBySpotId);

/**
 * GET /api/forecast/:spotId/daily
 * Forecast a 3 giorni: vento Open-Meteo + mare Copernicus reale per-giorno
 * (fallback ECMWF se Copernicus non risponde per un dato giorno).
 */
router.get("/:spotId/daily", getDailyForecastBySpotId);

/**
 * GET /api/forecast/:spotId/tide
 * Marea (Copernicus Marine SSH, aggiornata al massimo una volta al giorno
 * per spot) e temperatura dell'acqua (Open-Meteo Marine, al massimo ogni
 * 12 ore).
 */
router.get("/:spotId/tide", getTideBySpotId);

module.exports = router;
