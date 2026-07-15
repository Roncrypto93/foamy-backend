describe("forecastCache", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.FORECAST_CACHE_TTL;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test("TTL di default è 180 minuti (10800s) se FORECAST_CACHE_TTL non è impostata", () => {
    const forecastCache = require("./forecastCache");
    expect(forecastCache.TTL_SECONDS).toBe(10800);
  });

  test("rispetta FORECAST_CACHE_TTL se impostata", () => {
    process.env.FORECAST_CACHE_TTL = "300";
    const forecastCache = require("./forecastCache");
    expect(forecastCache.TTL_SECONDS).toBe(300);
  });

  test("upstashEnabled è false senza le variabili d'ambiente", () => {
    const forecastCache = require("./forecastCache");
    expect(forecastCache.upstashEnabled).toBe(false);
  });

  test("upstashEnabled è true con URL e token impostati", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    const forecastCache = require("./forecastCache");
    expect(forecastCache.upstashEnabled).toBe(true);
  });

  test("senza Upstash configurato: set/get funzionano solo con la cache locale", async () => {
    const forecastCache = require("./forecastCache");
    const value = { foo: "bar" };
    await forecastCache.set("test:local-only", value);
    const result = await forecastCache.get("test:local-only");
    expect(result).toEqual(value);
  });

  test("chiave mai scritta: get restituisce undefined senza lanciare errori", async () => {
    const forecastCache = require("./forecastCache");
    const result = await forecastCache.get("test:non-esiste");
    expect(result).toBeUndefined();
  });

  test("con Upstash configurato: set chiama la REST API con SET ed EX", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: "OK" }),
    });

    const forecastCache = require("./forecastCache");
    await forecastCache.set("test:upstash", { a: 1 });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.upstash.io",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
      })
    );
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body[0]).toBe("SET");
    expect(body[1]).toBe("test:upstash");
    expect(body[3]).toBe("EX");
    expect(body[4]).toBe("10800");
  });

  test("con Upstash configurato: se la REST API fallisce, get degrada con grazia sulla cache locale", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

    const forecastCache = require("./forecastCache");
    // Nessuna voce locale e Upstash irraggiungibile: niente eccezioni, solo undefined.
    const result = await forecastCache.get("test:upstash-down");
    expect(result).toBeUndefined();
  });
});
