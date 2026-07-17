function buildHourlyResponse({ speed, gfsGusts, iconGusts, hours = 24 }) {
  const time = Array.from({ length: hours }, (_, h) => `2026-07-17T${String(h).padStart(2, "0")}:00`);
  return {
    hourly: {
      time,
      wind_speed_10m_icon_eu: Array(hours).fill(speed),
      wind_gusts_10m_icon_eu: Array(hours).fill(iconGusts),
      wind_direction_10m_icon_eu: Array(hours).fill(300),
      wind_gusts_10m_gfs_seamless: Array(hours).fill(gfsGusts),
    },
  };
}

describe("weatherService.fetchWindForecast", () => {
  const ORIGINAL_ENV = process.env;
  let fetchWindForecast;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    ({ fetchWindForecast } = require("./weatherService"));
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("raffiche GFS normali (>= velocità): passano invariate", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => buildHourlyResponse({ speed: 10, gfsGusts: 15, iconGusts: 20 }),
    });

    const result = await fetchWindForecast(40.2, 18.4);

    expect(result.windSpeedKn).toBe(10);
    expect(result.windGustsKn).toBe(15);
  });

  test("raffiche GFS più basse della velocità (modelli incrociati incoerenti): vengono portate al livello della velocità, mai sotto", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => buildHourlyResponse({ speed: 12, gfsGusts: 8, iconGusts: 20 }),
    });

    const result = await fetchWindForecast(40.2, 18.4);

    expect(result.windSpeedKn).toBe(12);
    expect(result.windGustsKn).toBe(12);
    expect(result.windGustsKn).toBeGreaterThanOrEqual(result.windSpeedKn);
  });

  test("GFS non disponibile per il punto (null): ricade sulle raffiche ICON, comunque mai sotto la velocità", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => buildHourlyResponse({ speed: 10, gfsGusts: null, iconGusts: 14 }),
    });

    const result = await fetchWindForecast(40.2, 18.4);

    expect(result.windGustsKn).toBe(14);
  });

  test("ICON senza dati utilizzabili: ricade su best_match (raffiche sempre da GFS quando disponibili)", async () => {
    // buildHourlyResponse suffissa i campi con _icon_eu; per il ramo
    // best_match servono nomi corrispondenti, quindi la risposta è
    // costruita qui a mano.
    global.fetch = jest.fn((url) => {
      const u = String(url);
      if (u.includes("models=icon_eu")) {
        return Promise.resolve({ ok: true, json: async () => ({ hourly: { time: [], wind_speed_10m_icon_eu: [] } }) });
      }
      const hours = 24;
      const time = Array.from({ length: hours }, (_, h) => `2026-07-17T${String(h).padStart(2, "0")}:00`);
      return Promise.resolve({
        ok: true,
        json: async () => ({
          hourly: {
            time,
            wind_speed_10m_best_match: Array(hours).fill(9),
            wind_gusts_10m_best_match: Array(hours).fill(16),
            wind_direction_10m_best_match: Array(hours).fill(280),
            wind_gusts_10m_gfs_seamless: Array(hours).fill(13),
          },
        }),
      });
    });

    const result = await fetchWindForecast(40.2, 18.4);

    expect(result.modelUsed).toBe("best_match");
    expect(result.windSpeedKn).toBe(9);
    expect(result.windGustsKn).toBe(13); // GFS (13) >= velocità (9): usato così com'è, non le raffiche ICON/best_match (16)
  });
});
