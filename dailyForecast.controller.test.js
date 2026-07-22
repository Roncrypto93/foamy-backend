const request = require("supertest");

jest.mock("./dailyMarineService");

const { fetchWeeklyForecast } = require("./dailyMarineService");
const { createApp } = require("./app");

const app = createApp();

const DAYS_MOCK = [
  {
    date: "2026-07-14",
    windSpeedKn: 12.5,
    windGustsKn: 18.2,
    windDirectionDeg: 315,
    sea: { waveHeightM: 1.4, wavePeriodS: 7.0, waveDirectionDeg: 55, waterTempC: 24.3, seaLevelM: 0.12 },
    copernicusDegraded: false,
  },
  {
    date: "2026-07-15",
    windSpeedKn: 9.0,
    windGustsKn: 14.0,
    windDirectionDeg: 280,
    sea: { waveHeightM: 0.8, wavePeriodS: 5.5, waveDirectionDeg: 40, waterTempC: 24.1, seaLevelM: 0.08 },
    copernicusDegraded: false,
  },
  {
    date: "2026-07-16",
    windSpeedKn: 7.5,
    windGustsKn: 11.0,
    windDirectionDeg: 260,
    sea: { waveHeightM: null, wavePeriodS: null, waveDirectionDeg: null, waterTempC: null, seaLevelM: null },
    copernicusDegraded: true,
  },
  // Giorni 4-7: oltre COPERNICUS_REAL_DAYS, sempre degradati per design
  // (vedi dailyMarineService.js) — qui bastano dati minimi plausibili.
  { date: "2026-07-17", windSpeedKn: 10.0, windGustsKn: 15.0, windDirectionDeg: 270, sea: { waveHeightM: 0.6, wavePeriodS: 4.5, waveDirectionDeg: 250, waterTempC: 23.8, seaLevelM: 0.05 }, copernicusDegraded: true },
  { date: "2026-07-18", windSpeedKn: 8.0, windGustsKn: 12.5, windDirectionDeg: 200, sea: { waveHeightM: 0.5, wavePeriodS: 4.2, waveDirectionDeg: 210, waterTempC: 23.9, seaLevelM: 0.03 }, copernicusDegraded: true },
  { date: "2026-07-19", windSpeedKn: 14.0, windGustsKn: 20.0, windDirectionDeg: 330, sea: { waveHeightM: 1.0, wavePeriodS: 5.5, waveDirectionDeg: 320, waterTempC: 24.0, seaLevelM: 0.10 }, copernicusDegraded: true },
  { date: "2026-07-20", windSpeedKn: 11.0, windGustsKn: 16.0, windDirectionDeg: 300, sea: { waveHeightM: 0.7, wavePeriodS: 4.8, waveDirectionDeg: 290, waterTempC: 24.2, seaLevelM: 0.07 }, copernicusDegraded: true },
];

const CHART_MOCK = [
  { time: "2026-07-14T00:00", waveHeightM: 1.1, wavePeriodS: 6.5, waveDirectionDeg: 55 },
  { time: "2026-07-14T03:00", waveHeightM: 1.4, wavePeriodS: 7.0, waveDirectionDeg: 50 },
  { time: "2026-07-14T06:00", waveHeightM: 0.9, wavePeriodS: 5.8, waveDirectionDeg: 45 },
];

const WIND_CHART_MOCK = [
  { time: "2026-07-14T00:00", windSpeedKn: 10.2, windGustsKn: 15.5, windDirectionDeg: 310 },
  { time: "2026-07-14T03:00", windSpeedKn: 12.5, windGustsKn: 18.2, windDirectionDeg: 315 },
  { time: "2026-07-14T06:00", windSpeedKn: 8.1, windGustsKn: 12.0, windDirectionDeg: 300 },
];

const WEEK_MOCK = { days: DAYS_MOCK, chart: CHART_MOCK, windChart: WIND_CHART_MOCK };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/forecast/:spotId/daily", () => {
  test("404 se lo spot non esiste", async () => {
    const res = await request(app).get("/api/forecast/spot-inesistente/daily");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("SPOT_NOT_FOUND");
  });

  test("200 con 7 giorni, energia e scala Douglas calcolate per ciascuno", async () => {
    fetchWeeklyForecast.mockResolvedValue(WEEK_MOCK);

    const res = await request(app).get("/api/forecast/san-foca/daily");

    expect(res.status).toBe(200);
    expect(res.body.spot.id).toBe("san-foca");
    expect(res.body.days).toHaveLength(7);

    const day0 = res.body.days[0];
    expect(day0.wind).toEqual({ speedKn: 12.5, gustsKn: 18.2, directionDeg: 315 });
    // energia: 1.4^2 * 7 * 10 = 137.2 -> 137
    expect(day0.sea.waveEnergyKJ).toBe(137);
    expect(day0.sea.seaState).toBe("Forza 4 - Molto Mosso");
    expect(day0.sea.copernicusDegraded).toBe(false);
    expect(day0.sea.waterTempC).toBe(24.3);
    expect(day0.sea.seaLevelM).toBe(0.12);
    // Punteggio surf: san-foca ha "wave" tra le discipline e
    // coastOrientationDeg 70. baseLevel "Ottima" (1.4m/7s -> ">1.2m"x"7-9s"),
    // vento 315° a 12.5kn è cross-offshore (65° dall'offshore a 250°) ->
    // bump -> "Perfetto".
    expect(day0.sea.surfRating).toEqual({ rating: "Perfetto", baseLevel: "Ottima", windEffect: "bump" });

    const day2 = res.body.days[2];
    expect(day2.sea.copernicusDegraded).toBe(true);
    expect(day2.sea.waveEnergyKJ).toBeNull();
    expect(day2.sea.seaState).toBe("N/D");
    // Altezza/periodo mancanti (day2 ha sea nullo): niente punteggio possibile.
    expect(day2.sea.surfRating).toEqual({ rating: null, baseLevel: null, windEffect: "unavailable" });

    expect(res.body.chart).toHaveLength(3);
    // energia primo punto: 1.1^2 * 6.5 * 10 = 78.65 -> 79. waveDirectionDeg
    // ora presente (mancava dalla risposta, bug trovato e corretto). Stesso
    // ragionamento del punteggio di day0 sopra ma con windChart[0]
    // (10.2kn/310°, cross-offshore anche questo) -> baseLevel "Ottima"
    // (1.1m/6.5s -> "0.8-1.2m"x"5.5-7s") -> bump -> "Perfetto".
    expect(res.body.chart[0]).toEqual({
      time: "2026-07-14T00:00",
      waveHeightM: 1.1,
      wavePeriodS: 6.5,
      waveDirectionDeg: 55,
      waveEnergyKJ: 79,
      surfRating: { rating: "Perfetto", baseLevel: "Ottima", windEffect: "bump" },
    });

    expect(res.body.windChart).toHaveLength(3);
    expect(res.body.windChart[1]).toEqual({ time: "2026-07-14T03:00", windSpeedKn: 12.5, windGustsKn: 18.2, windDirectionDeg: 315 });
  });

  test("nessun surfRating per spot senza disciplina 'wave' (kite/windsurf fuori scope)", async () => {
    // Spot diverso da quello usato nel test della cache più sotto
    // (bari-pane-pomodoro): forecastCache non è mockato, quindi lo stato
    // resta condiviso tra i test di questo file — riusare lo stesso spot
    // farebbe risultare "già in cache" il primo request di quel test.
    fetchWeeklyForecast.mockResolvedValue(WEEK_MOCK);

    const res = await request(app).get("/api/forecast/torre-guaceto/daily");

    expect(res.status).toBe(200);
    expect(res.body.days[0].sea.surfRating).toBeUndefined();
    expect(res.body.chart[0].surfRating).toBeUndefined();
  });

  test("502 se il recupero del forecast fallisce del tutto", async () => {
    fetchWeeklyForecast.mockRejectedValue(new Error("Open-Meteo down"));

    const res = await request(app).get("/api/forecast/frigole/daily");

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("UPSTREAM_API_ERROR");
  });

  test("una seconda richiesta per lo stesso spot usa la cache", async () => {
    fetchWeeklyForecast.mockResolvedValue(WEEK_MOCK);

    const first = await request(app).get("/api/forecast/bari-pane-pomodoro/daily");
    expect(first.status).toBe(200);
    expect(first.body.cache).toBe(false);

    const second = await request(app).get("/api/forecast/bari-pane-pomodoro/daily");
    expect(second.status).toBe(200);
    expect(second.body.cache).toBe(true);

    expect(fetchWeeklyForecast).toHaveBeenCalledTimes(1);
  });
});
