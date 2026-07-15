const COPERNICUS_TEST_URL = "http://fake-copernicus.test";

function buildHourlyTimes(days) {
  const times = [];
  for (let d = 0; d < days; d++) {
    for (let h = 0; h < 24; h++) {
      times.push(`2026-07-${String(14 + d).padStart(2, "0")}T${String(h).padStart(2, "0")}:00`);
    }
  }
  return times;
}

function mockWindResponse(days) {
  const time = buildHourlyTimes(days);
  return {
    daily: {
      time: Array.from({ length: days }, (_, i) => `2026-07-${String(14 + i).padStart(2, "0")}`),
      wind_speed_10m_max: Array(days).fill(12),
      wind_gusts_10m_max: Array(days).fill(18),
      wind_direction_10m_dominant: Array(days).fill(300),
    },
    hourly: {
      time,
      wind_speed_10m: time.map(() => 10),
      wind_gusts_10m: time.map(() => 15),
      wind_direction_10m: time.map(() => 300),
    },
  };
}

function mockMarineResponse(days) {
  const time = buildHourlyTimes(days);
  return {
    daily: {
      time: Array.from({ length: days }, (_, i) => `2026-07-${String(14 + i).padStart(2, "0")}`),
      wave_height_max: Array(days).fill(0.8),
      wave_period_max: Array(days).fill(5),
      wave_direction_dominant: Array(days).fill(250),
    },
    hourly: {
      time,
      wave_height: time.map(() => 0.6),
      wave_period: time.map(() => 4.5),
      sea_surface_temperature: time.map(() => 24),
      sea_level_height_msl: time.map(() => 0.1),
    },
  };
}

function mockFetchImpl() {
  return jest.fn((url) => {
    const u = String(url);
    if (u.includes("api.open-meteo.com")) {
      return Promise.resolve({ ok: true, json: async () => mockWindResponse(7) });
    }
    if (u.includes("marine-api.open-meteo.com")) {
      return Promise.resolve({ ok: true, json: async () => mockMarineResponse(7) });
    }
    if (u.startsWith(COPERNICUS_TEST_URL)) {
      return Promise.resolve({ ok: true, json: async () => ({ waveHeightM: 1.2, wavePeriodS: 6, waveDirectionDeg: 200 }) });
    }
    throw new Error("URL non mockato in questo test: " + u);
  });
}

describe("dailyMarineService.fetchWeeklyForecast", () => {
  const ORIGINAL_ENV = process.env;
  let fetchWeeklyForecast;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, COPERNICUS_SERVICE_URL: COPERNICUS_TEST_URL };
    delete process.env.COPERNICUS_REAL_DAYS;
    ({ fetchWeeklyForecast } = require("./dailyMarineService"));
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("restituisce 7 giorni e 56 punti a step di 3h nei grafici", async () => {
    global.fetch = mockFetchImpl();
    const result = await fetchWeeklyForecast(40.3, 18.4);

    expect(result.days).toHaveLength(7);
    expect(result.chart).toHaveLength(56);
    expect(result.windChart).toHaveLength(56);
  });

  test("interroga Copernicus solo per i primi 3 giorni, non per tutti e 7", async () => {
    global.fetch = mockFetchImpl();
    await fetchWeeklyForecast(40.3, 18.4);

    const copernicusCalls = global.fetch.mock.calls.filter(([url]) => String(url).startsWith(COPERNICUS_TEST_URL));
    expect(copernicusCalls).toHaveLength(3);
  });

  test("i primi 3 giorni usano Copernicus reale, i giorni 4-7 degradano su ECMWF", async () => {
    global.fetch = mockFetchImpl();
    const result = await fetchWeeklyForecast(40.3, 18.4);

    for (let i = 0; i < 3; i++) {
      expect(result.days[i].copernicusDegraded).toBe(false);
      expect(result.days[i].sea.source).toBe("copernicus-marine-cmems");
    }
    for (let i = 3; i < 7; i++) {
      expect(result.days[i].copernicusDegraded).toBe(true);
      expect(result.days[i].sea.source).toBe("open-meteo-ecmwf");
    }
  });

  test("i giorni oltre il limite Copernicus non generano un warning di 'fallito' (sono saltati apposta, non falliti)", async () => {
    global.fetch = mockFetchImpl();
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    await fetchWeeklyForecast(40.3, 18.4);

    const failWarnings = warnSpy.mock.calls.filter((args) => String(args[0] || "").includes("Copernicus fallito"));
    expect(failWarnings).toHaveLength(0);
    warnSpy.mockRestore();
  });

  test("rispetta COPERNICUS_REAL_DAYS se impostata a un valore diverso", async () => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, COPERNICUS_SERVICE_URL: COPERNICUS_TEST_URL, COPERNICUS_REAL_DAYS: "1" };
    const { fetchWeeklyForecast: fetchWithCustomLimit } = require("./dailyMarineService");

    global.fetch = mockFetchImpl();
    const result = await fetchWithCustomLimit(40.3, 18.4);

    const copernicusCalls = global.fetch.mock.calls.filter(([url]) => String(url).startsWith(COPERNICUS_TEST_URL));
    expect(copernicusCalls).toHaveLength(1);
    expect(result.days[0].copernicusDegraded).toBe(false);
    expect(result.days[1].copernicusDegraded).toBe(true);
  });

  test("un giorno Copernicus fallito (non solo saltato) degrada e logga un warning", async () => {
    global.fetch = jest.fn((url) => {
      const u = String(url);
      if (u.includes("api.open-meteo.com")) return Promise.resolve({ ok: true, json: async () => mockWindResponse(7) });
      if (u.includes("marine-api.open-meteo.com")) return Promise.resolve({ ok: true, json: async () => mockMarineResponse(7) });
      if (u.startsWith(COPERNICUS_TEST_URL)) return Promise.resolve({ ok: false, status: 502, text: async () => "errore simulato" });
      throw new Error("URL non mockato: " + u);
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = await fetchWeeklyForecast(40.3, 18.4);

    expect(result.days[0].copernicusDegraded).toBe(true);
    expect(result.days[0].sea.source).toBe("open-meteo-ecmwf");
    const failWarnings = warnSpy.mock.calls.filter((args) => String(args[0] || "").includes("Copernicus fallito"));
    expect(failWarnings.length).toBeGreaterThan(0);
    warnSpy.mockRestore();
  });
});
