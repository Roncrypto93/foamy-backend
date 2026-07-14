/**
 * app.js
 * Factory dell'app Express, separata da server.js (che si occupa solo di
 * fare app.listen()). Separare le due cose permette ai test di importare
 * l'app con supertest senza aprire una porta reale.
 */

const express = require("express");
const cors = require("cors");

const spotsRoutes = require("./src/routes/spots.routes");
const forecastRoutes = require("./src/routes/forecast.routes");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ service: "foamy-backend", status: "ok", region: "Puglia (MVP)" });
  });

  app.use("/api/spots", spotsRoutes);
  app.use("/api/forecast", forecastRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: "Endpoint non trovato." });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error("[app] Unhandled error:", err);
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Errore interno del server." });
  });

  return app;
}

module.exports = { createApp };
