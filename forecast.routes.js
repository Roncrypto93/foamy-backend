const express = require("express");
const { getForecastBySpotId } = require("../controllers/forecast.controller");

const router = express.Router();

/**
 * GET /api/forecast/:spotId
 * Esegue fetch vento+mare, calcoli di media, energia onda (kJ),
 * scala Douglas, e restituisce il JSON pulito comprensivo di webcam banner.
 */
router.get("/:spotId", getForecastBySpotId);

module.exports = router;
