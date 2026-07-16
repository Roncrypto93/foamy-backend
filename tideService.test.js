const COPERNICUS_TEST_URL = "http://fake-copernicus.test";

function mockWaterTempResponse() {
  const time = Array.from({ length: 24 }, (_, h) => `2026-07-16T${String(h).padStart(2, "0")}:00`);
  return { hourly: { time, sea_surface_temperature: time.map(() => 24.3) } };
}

function mockTideResponse(hourly) {
  return { source: "copernicus-marine-cmems", datasetId: "cmems_mod_med_phy-ssh_anfc_4.2km-2D_PT1H-m", hourly, date: "2026-07-16" };
}

function buildHourly(levels) {
  return levels.map((level, h) => ({ time: `${String(h).padStart(2, "0")}:00`, level }));
}

function mockFetchImpl(tideHourly) {
  return jest.fn((url) => {
    const u = String(url);
    if (u.includes("marine-api.open-meteo.com")) {
      return Promise.resolve({ ok: true, json: async () => mockWaterTempResponse() });
    }
    if (u.startsWith(COPERNICUS_TEST_URL)) {
      return Promise.resolve({ ok: true, json: async () => mockTideResponse(tideHourly) });
    }
    throw new Error("URL non mockato in questo test: " + u);
  });
}

describe("tideService.computeCurrentLevelAndTrend", () => {
  let computeCurrentLevelAndTrend;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...process.env, COPERNICUS_SERVICE_URL: COPERNICUS_TEST_URL };
    ({ computeCurrentLevelAndTrend } = require("./tideService"));
  });

  test("array vuoto: currentLevel e trend sono null", () => {
    expect(computeCurrentLevelAndTrend([], 10)).toEqual({ currentLevel: null, trend: null });
  });

  test("livello in salita rispetto all'ora precedente: trend 'rising'", () => {
    const hourly = buildHourly([0.1, 0.2, 0.35]);
    const result = computeCurrentLevelAndTrend(hourly, 2);
    expect(result.currentLevel).toBe(0.35);
    expect(result.trend).toBe("rising");
  });

  test("livello in discesa rispetto all'ora precedente: trend 'falling'", () => {
    const hourly = buildHourly([0.4, 0.3, 0.15]);
    const result = computeCurrentLevelAndTrend(hourly, 2);
    expect(result.currentLevel).toBe(0.15);
    expect(result.trend).toBe("falling");
  });

  test("ora 0 (nessuna ora precedente): usa la successiva per il trend", () => {
    const hourly = buildHourly([0.1, 0.3]);
    const result = computeCurrentLevelAndTrend(hourly, 0);
    expect(result.currentLevel).toBe(0.1);
    expect(result.trend).toBe("rising");
  });
});

describe("tideService.fetchTideAndWaterTemp", () => {
  const ORIGINAL_ENV = process.env;
  let fetchTideAndWaterTemp;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, COPERNICUS_SERVICE_URL: COPERNICUS_TEST_URL };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    ({ fetchTideAndWaterTemp } = require("./tideService"));
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("combina temperatura acqua e marea in un unico risultato", async () => {
    const hourly = buildHourly(Array.from({ length: 24 }, (_, h) => 0.1 + h * 0.01));
    global.fetch = mockFetchImpl(hourly);

    const result = await fetchTideAndWaterTemp("frassanito", 40.2, 18.4);

    expect(result.waterTemp).toBe(24.3);
    expect(result.hourly).toHaveLength(24);
    expect(result.currentLevel).not.toBeNull();
    expect(["rising", "falling"]).toContain(result.trend);
  });

  test("seconda chiamata per lo stesso spot: usa la cache, non richiama né Open-Meteo né Copernicus", async () => {
    const hourly = buildHourly(Array.from({ length: 24 }, () => 0.2));
    global.fetch = mockFetchImpl(hourly);

    await fetchTideAndWaterTemp("frassanito", 40.2, 18.4);
    const callsAfterFirst = global.fetch.mock.calls.length;
    await fetchTideAndWaterTemp("frassanito", 40.2, 18.4);
    const callsAfterSecond = global.fetch.mock.calls.length;

    expect(callsAfterSecond).toBe(callsAfterFirst);
  });

  test("se la temperatura dell'acqua fallisce, la marea resta comunque disponibile (degrado indipendente)", async () => {
    const hourly = buildHourly(Array.from({ length: 24 }, () => 0.2));
    global.fetch = jest.fn((url) => {
      const u = String(url);
      if (u.includes("marine-api.open-meteo.com")) return Promise.resolve({ ok: false, status: 500, text: async () => "errore simulato" });
      if (u.startsWith(COPERNICUS_TEST_URL)) return Promise.resolve({ ok: true, json: async () => mockTideResponse(hourly) });
      throw new Error("URL non mockato: " + u);
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = await fetchTideAndWaterTemp("torre-canne", 40.8, 17.4);

    expect(result.waterTemp).toBeNull();
    expect(result.hourly).toHaveLength(24);
    warnSpy.mockRestore();
  });

  test("se Copernicus fallisce, la temperatura dell'acqua resta comunque disponibile (degrado indipendente)", async () => {
    global.fetch = jest.fn((url) => {
      const u = String(url);
      if (u.includes("marine-api.open-meteo.com")) return Promise.resolve({ ok: true, json: async () => mockWaterTempResponse() });
      if (u.startsWith(COPERNICUS_TEST_URL)) return Promise.resolve({ ok: false, status: 502, text: async () => "errore simulato" });
      throw new Error("URL non mockato: " + u);
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = await fetchTideAndWaterTemp("torre-canne", 40.8, 17.4);

    expect(result.waterTemp).toBe(24.3);
    expect(result.hourly).toEqual([]);
    expect(result.currentLevel).toBeNull();
    expect(result.trend).toBeNull();
    warnSpy.mockRestore();
  });
});
