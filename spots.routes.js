const express = require("express");
const SPOTS = require("./spots");

const router = express.Router();

/**
 * GET /api/spots
 * Restituisce la lista completa dei 19 spot Puglia (senza dati forecast,
 * che vengono recuperati on-demand da /api/forecast/:spotId).
 */
router.get("/", (req, res) => {
  res.json({
    count: SPOTS.length,
    spots: SPOTS,
  });
});

module.exports = router;
