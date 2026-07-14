/**
 * server.js
 * Entry point del backend Foamy MVP (Puglia).
 * Architettura: routes -> controllers -> services -> utils
 * Pensata per essere scalata: aggiungere nuove regioni significa solo
 * estendere src/data (o migrarlo a DB) e riusare la stessa pipeline
 * wind/marine/calcoli per qualsiasi coordinata.
 *
 * La creazione dell'app Express è isolata in app.js così i test (Jest +
 * Supertest) possono importarla senza aprire una porta reale.
 */

require("dotenv").config();
const { createApp } = require("./app");

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`🌊 Foamy backend in ascolto su http://localhost:${PORT}`);
  console.log(`   GET /api/spots`);
  console.log(`   GET /api/forecast/:spotId  (es. /api/forecast/san-foca)`);
});
