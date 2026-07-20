/**
 * forecast.controller.js
 * Orchestratore dell'endpoint GET /api/forecast/:spotId.
 * Effettua le chiamate in parallelo, esegue il merge/i calcoli fisici,
 * e restituisce un JSON pulito e scannabile per il frontend.
 */

const SPOTS = require("./spots");
const { fetchWindForecast } = require("./weatherService");
const {
  fetchOpenMeteoMarine,
  fetchCopernicusMarine,
} = require("./marineService");
const {
  mergeMarineData,
  calculateWaveEnergyKJ,
  getDouglasSeaState,
} = require("./waveCalculations");
const forecastCache = require("./forecastCache");

// Correzione manuale fissa: confronto sul campo con un anemometro ha
// mostrato che il vento live (Open-Meteo) è sistematicamente più basso
// della realtà. Applicata solo qui (condizioni attuali), non al forecast
// settimanale, perché è l'unico dato verificabile in tempo reale con uno
// strumento fisico — non c'è modo di validare allo stesso modo un dato
// previsionale su giorni futuri. Solo sulla velocità media, non sulle
// raffiche (che restano il dato Open-Meteo grezzo).
const WIND_SPEED_CORRECTION_KN = Number(process.env.WIND_SPEED_CORRECTION_KN) || 0.5;

async function getForecastBySpotId(req, res) {
  const { spotId } = req.params;

  const spot = SPOTS.find((s) => s.id === spotId);
  if (!spot) {
    return res.status(404).json({
      error: "SPOT_NOT_FOUND",
      message: `Nessuno spot trovato con id "${spotId}".`,
    });
  }

  const cacheKey = `forecast:${spotId}`;
  const cached = await forecastCache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, cache: true });
  }

  try {
    // Chiamate parallele: vento (Open-Meteo) + le due fonti mare (Open-Meteo
    // ECMWF e Copernicus Marine/CMEMS via toolbox Python).
    // Usiamo allSettled per il mare: Copernicus richiede un sottoprocesso
    // Python e credenziali esterne, quindi può fallire/andare in timeout
    // indipendentemente da Open-Meteo. In quel caso degradiamo con grazia
    // usando solo il dato ECMWF, invece di far fallire l'intera richiesta.
    const [windResult, ecmwfResult, copernicusResult] = await Promise.allSettled([
      fetchWindForecast(spot.lat, spot.lon),
      fetchOpenMeteoMarine(spot.lat, spot.lon),
      fetchCopernicusMarine(spot.lat, spot.lon),
    ]);

    // Il vento è considerato essenziale: se fallisce, propaghiamo l'errore.
    if (windResult.status === "rejected") throw windResult.reason;
    if (ecmwfResult.status === "rejected") throw ecmwfResult.reason;

    const wind = windResult.value;
    const ecmwfMarine = ecmwfResult.value;

    let copernicusMarine;
    let copernicusDegraded = false;
    if (copernicusResult.status === "fulfilled") {
      copernicusMarine = copernicusResult.value;
    } else {
      // Fallback: nessun dato Copernicus disponibile in questo giro.
      // Logghiamo il motivo e proseguiamo solo con ECMWF per non bloccare
      // l'esperienza utente su un singolo modello mancante.
      console.warn(
        `[forecast.controller] Copernicus Marine non disponibile per ${spotId}:`,
        copernicusResult.reason?.message
      );
      copernicusDegraded = true;
      copernicusMarine = {
        source: "copernicus-marine-unavailable",
        waveHeightM: null,
        wavePeriodS: null,
        waveDirectionDeg: null,
      };
    }

    // Merge secondo la logica di media (altezza/periodo media, direzione da Copernicus).
    const merged = mergeMarineData(ecmwfMarine, copernicusMarine);

    const waveEnergyKJ = calculateWaveEnergyKJ(merged.waveHeightM, merged.wavePeriodS);
    const seaState = getDouglasSeaState(merged.waveHeightM);

    const payload = {
      spot: {
        id: spot.id,
        name: spot.name,
        coast: spot.coast,
        disciplines: spot.disciplines,
        lat: spot.lat,
        lon: spot.lon,
      },
      wind: (() => {
        // gustFloor() in weatherService.js garantisce raffiche >= velocità
        // sul dato grezzo, ma qui sopra la velocità viene corretta (+0.5kn
        // di taratura anemometro) SENZA correggere le raffiche: se il
        // margine originale era piccolo, la raffica corretta può finire
        // sotto la velocità corretta. Va riverificato con la velocità già
        // corretta, non con quella grezza.
        const speedKn = applyWindCorrection(wind.windSpeedKn);
        return {
          speedKn,
          gustsKn: gustFloor(wind.windGustsKn, speedKn),
          directionDeg: wind.windDirectionDeg,
        };
      })(),
      sea: {
        waveHeightM: merged.waveHeightM,
        wavePeriodS: merged.wavePeriodS,
        waveDirectionDeg: merged.waveDirectionDeg,
        waveEnergyKJ,
        seaState,
        sources: {
          openMeteo: ecmwfMarine,
          copernicus: copernicusMarine,
        },
        copernicusDegraded,
      },
      webcam_banner: spot.webcam_banner,
      generatedAt: new Date().toISOString(),
      cache: false,
    };

    await forecastCache.set(cacheKey, payload);
    return res.json(payload);
  } catch (err) {
    console.error(`[forecast.controller] Errore per spot ${spotId}:`, err);
    return res.status(502).json({
      error: "UPSTREAM_API_ERROR",
      message: "Errore nel recupero dei dati meteo/mare dalle API esterne.",
      detail: err.message,
    });
  }
}

function applyWindCorrection(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  return Math.round((value + WIND_SPEED_CORRECTION_KN) * 10) / 10;
}

// Una raffica non può mai essere fisicamente più bassa della velocità
// media. Stessa guardia già presente in weatherService.js e
// dailyMarineService.js, duplicata qui perché applyWindCorrection() può
// da sola rompere l'invariante impostata a monte (vedi commento sopra).
function gustFloor(gusts, speed) {
  if (gusts === undefined || gusts === null) return speed;
  if (speed === undefined || speed === null) return gusts;
  return Math.max(gusts, speed);
}

module.exports = { getForecastBySpotId };
