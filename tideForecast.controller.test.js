const request = require("supertest");

jest.mock("./tideService");

const { fetchTideAndWaterTemp } = require("./tideService");
const { createApp } = require("./app");

const app = createApp();

const TIDE_MOCK = {
  waterTemp: 23.8,
  hourly: [
    { time: "08:00", level: 0.05 },
    { time: "09:00", level: 0.12 },
  ],
  currentLevel: 0.12,
  trend: "rising",
  date: "2026-07-16",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/forecast/:spotId/tide", () => {
  test("risponde 200 con la struttura JSON attesa (snake_case)", async () => {
    fetchTideAndWaterTemp.mockResolvedValue(TIDE_MOCK);

    const res = await request(app).get("/api/forecast/frassanito/tide");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      spot_id: "frassanito",
      water_temp: 23.8,
      tide: {
        current_level: 0.12,
        trend: "rising",
        hourly_forecast: [
          { time: "08:00", level: 0.05 },
          { time: "09:00", level: 0.12 },
        ],
      },
    });
  });

  test("spot inesistente: 404", async () => {
    const res = await request(app).get("/api/forecast/spot-che-non-esiste/tide");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("SPOT_NOT_FOUND");
    expect(fetchTideAndWaterTemp).not.toHaveBeenCalled();
  });

  test("errore imprevisto nel servizio: 502", async () => {
    fetchTideAndWaterTemp.mockRejectedValue(new Error("boom"));

    const res = await request(app).get("/api/forecast/frassanito/tide");

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("UPSTREAM_API_ERROR");
  });
});
