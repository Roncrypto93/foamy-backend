const request = require("supertest");

jest.mock("./dailyMarineService");

const { fetchThreeDayForecast } = require("./dailyMarineService");
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
];

const CHART_MOCK = [
  { time: "2026-07-14T00:00", waveHeightM: 1.1, wavePeriodS: 6.5 },
  { time: "2026-07-14T03:00", waveHeightM: 1.4, wavePeriodS: 7.0 },
  { time: "2026-07-14T06:00", waveHeightM: 0.9, wavePeriodS: 5.8 },
];

const WIND_CHART_MOCK = [
  { time: "2026-07-14T00:00", windSpeedKn: 10.2, windGustsKn: 15.5, windDirectionDeg: 310 },
  { time: "2026-07-14T03:00", windSpeedKn: 12.5, windGustsKn: 18.2, windDirectionDeg: 315 },
  { time: "2026-07-14T06:00", windSpeedKn: 8.1, windGustsKn: 12.0, windDirectionDeg: 300 },
];

const THREE_DAY_MOCK = { days: DAYS_MOCK, chart: CHART_MOCK, windChart: WIND_CHART_MOCK };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/forecast/:spotId/daily", () => {
  test("404 se lo spot non esiste", async () => {
    const res = await request(app).get("/api/forecast/spot-inesistente/daily");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("SPOT_NOT_FOUND");
  });

  test("200 con 3 giorni, energia e scala Douglas calcolate per ciascuno", async () => {
    fetchThreeDayForecast.mockResolvedValue(THREE_DAY_MOCK);

    const res = await request(app).get("/api/forecast/san-foca/daily");

    expect(res.status).toBe(200);
    expect(res.body.spot.id).toBe("san-foca");
    expect(res.body.days).toHaveLength(3);

    const day0 = res.body.days[0];
    expect(day0.wind).toEqual({ speedKn: 12.5, gustsKn: 18.2, directionDeg: 315 });
    // energia: 0.5 * 1.4^2 * 7 * 10 = 68.6 -> 69
    expect(day0.sea.waveEnergyKJ).toBe(69);
    expect(day0.sea.seaState).toBe("Forza 4 - Molto Mosso");
    expect(day0.sea.copernicusDegraded).toBe(false);
    expect(day0.sea.waterTempC).toBe(24.3);
    expect(day0.sea.seaLevelM).toBe(0.12);

    const day2 = res.body.days[2];
    expect(day2.sea.copernicusDegraded).toBe(true);
    expect(day2.sea.waveEnergyKJ).toBeNull();
    expect(day2.sea.seaState).toBe("N/D");

    expect(res.body.chart).toHaveLength(3);
    // energia primo punto: 0.5 * 1.1^2 * 6.5 * 10 = 39.325 -> 39
    expect(res.body.chart[0]).toEqual({ time: "2026-07-14T00:00", waveHeightM: 1.1, wavePeriodS: 6.5, waveEnergyKJ: 39 });

    expect(res.body.windChart).toHaveLength(3);
    expect(res.body.windChart[1]).toEqual({ time: "2026-07-14T03:00", windSpeedKn: 12.5, windGustsKn: 18.2, windDirectionDeg: 315 });
  });

  test("502 se il recupero del forecast fallisce del tutto", async () => {
    fetchThreeDayForecast.mockRejectedValue(new Error("Open-Meteo down"));

    const res = await request(app).get("/api/forecast/frigole/daily");

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("UPSTREAM_API_ERROR");
  });

  test("una seconda richiesta per lo stesso spot usa la cache", async () => {
    fetchThreeDayForecast.mockResolvedValue(THREE_DAY_MOCK);

    const first = await request(app).get("/api/forecast/bari-pane-pomodoro/daily");
    expect(first.status).toBe(200);
    expect(first.body.cache).toBe(false);

    const second = await request(app).get("/api/forecast/bari-pane-pomodoro/daily");
    expect(second.status).toBe(200);
    expect(second.body.cache).toBe(true);

    expect(fetchThreeDayForecast).toHaveBeenCalledTimes(1);
  });
});
