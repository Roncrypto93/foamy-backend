const request = require("supertest");

// Mock dei servizi esterni: nessuna chiamata di rete reale nei test.
jest.mock("./weatherService");
jest.mock("./marineService");

const { fetchWindForecast } = require("./weatherService");
const { fetchOpenMeteoMarine, fetchCopernicusMarine } = require("./marineService");

const { createApp } = require("./app");

const app = createApp();

const WIND_MOCK = { windSpeedKn: 12.5, windGustsKn: 18.2, windDirectionDeg: 315 };
const ECMWF_MOCK = {
  source: "open-meteo-ecmwf",
  waveHeightM: 1.0,
  wavePeriodS: 6.0,
  waveDirectionDeg: 40,
  timestamp: "2026-07-14T10:00:00Z",
};
const COPERNICUS_MOCK = {
  source: "copernicus-marine-cmems",
  waveHeightM: 1.4,
  wavePeriodS: 7.0,
  waveDirectionDeg: 55,
  timestamp: "2026-07-14T10:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/spots", () => {
  test("risponde 200 con 20 spot", async () => {
    const res = await request(app).get("/api/spots");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(20);
    expect(res.body.spots).toHaveLength(20);
  });
});

describe("GET /api/forecast/:spotId", () => {
  test("404 se lo spot non esiste", async () => {
    const res = await request(app).get("/api/forecast/spot-inesistente");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("SPOT_NOT_FOUND");
  });

  test("200 con dati completi quando tutte le fonti rispondono correttamente", async () => {
    fetchWindForecast.mockResolvedValue(WIND_MOCK);
    fetchOpenMeteoMarine.mockResolvedValue(ECMWF_MOCK);
    fetchCopernicusMarine.mockResolvedValue(COPERNICUS_MOCK);

    const res = await request(app).get("/api/forecast/san-foca");

    expect(res.status).toBe(200);
    expect(res.body.spot.id).toBe("san-foca");
    expect(res.body.wind).toEqual({
      speedKn: 12.5,
      gustsKn: 18.2,
      directionDeg: 315,
    });
    // media altezza: (1.0 + 1.4) / 2 = 1.2 ; media periodo: (6 + 7) / 2 = 6.5
    expect(res.body.sea.waveHeightM).toBeCloseTo(1.2, 5);
    expect(res.body.sea.wavePeriodS).toBeCloseTo(6.5, 5);
    // direzione: priorità a Copernicus (55)
    expect(res.body.sea.waveDirectionDeg).toBe(55);
    // energia: 0.5 * 1.2^2 * 6.5 * 10 = 46.8 -> 47
    expect(res.body.sea.waveEnergyKJ).toBe(47);
    expect(res.body.sea.seaState).toBe("Forza 3 - Mosso");
    expect(res.body.sea.copernicusDegraded).toBe(false);
    expect(res.body.webcam_banner).toBeDefined();
    expect(res.body.webcam_banner.provider).toBeDefined();
  });

  test("degrada con grazia (solo ECMWF) se Copernicus fallisce, senza restituire errore", async () => {
    fetchWindForecast.mockResolvedValue(WIND_MOCK);
    fetchOpenMeteoMarine.mockResolvedValue(ECMWF_MOCK);
    fetchCopernicusMarine.mockRejectedValue(new Error("Timeout CMEMS simulato"));

    const res = await request(app).get("/api/forecast/torre-dellorso");

    expect(res.status).toBe(200);
    expect(res.body.sea.copernicusDegraded).toBe(true);
    // Con Copernicus assente, altezza/periodo/direzione ricadono sul solo dato ECMWF
    expect(res.body.sea.waveHeightM).toBe(ECMWF_MOCK.waveHeightM);
    expect(res.body.sea.wavePeriodS).toBe(ECMWF_MOCK.wavePeriodS);
    expect(res.body.sea.waveDirectionDeg).toBe(ECMWF_MOCK.waveDirectionDeg);
  });

  test("502 se anche la fonte vento essenziale fallisce", async () => {
    fetchWindForecast.mockRejectedValue(new Error("Open-Meteo down"));
    fetchOpenMeteoMarine.mockResolvedValue(ECMWF_MOCK);
    fetchCopernicusMarine.mockResolvedValue(COPERNICUS_MOCK);

    const res = await request(app).get("/api/forecast/frigole");

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("UPSTREAM_API_ERROR");
  });

  test("una seconda richiesta per lo stesso spot usa la cache (nessuna nuova chiamata ai servizi)", async () => {
    fetchWindForecast.mockResolvedValue(WIND_MOCK);
    fetchOpenMeteoMarine.mockResolvedValue(ECMWF_MOCK);
    fetchCopernicusMarine.mockResolvedValue(COPERNICUS_MOCK);

    const first = await request(app).get("/api/forecast/bari-pane-pomodoro");
    expect(first.status).toBe(200);
    expect(first.body.cache).toBe(false);

    const second = await request(app).get("/api/forecast/bari-pane-pomodoro");
    expect(second.status).toBe(200);
    expect(second.body.cache).toBe(true);

    // I servizi esterni devono essere stati chiamati una sola volta in totale
    expect(fetchWindForecast).toHaveBeenCalledTimes(1);
    expect(fetchOpenMeteoMarine).toHaveBeenCalledTimes(1);
    expect(fetchCopernicusMarine).toHaveBeenCalledTimes(1);
  });
});
