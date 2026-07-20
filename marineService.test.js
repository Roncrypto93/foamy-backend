function buildHourlyResponse({ height, period, hours = 24 }) {
  const time = Array.from({ length: hours }, (_, h) => `2026-07-20T${String(h).padStart(2, "0")}:00`);
  return {
    hourly: {
      time,
      wave_height: Array(hours).fill(height),
      swell_wave_period: Array(hours).fill(period),
      wave_direction: Array(hours).fill(140),
    },
  };
}

describe("marineService.fetchOpenMeteoMarine", () => {
  test("usa ecmwf_wam025 quando ha sia altezza che periodo utilizzabili", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => buildHourlyResponse({ height: 0.8, period: 6 }),
    });

    const { fetchOpenMeteoMarine } = require("./marineService");
    const result = await fetchOpenMeteoMarine(40.3, 18.4);

    expect(result.source).toBe("ecmwf_wam025");
    expect(result.waveHeightM).toBe(0.8);
    expect(result.wavePeriodS).toBe(6);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // Bug reale trovato confrontando i dati live: ecmwf_wam025 restituisce
  // sempre swell_wave_period nullo (il modello non ha la scomposizione
  // swell/mare da vento), ma wave_height valido. Un controllo di fallback
  // basato sulla sola altezza non scattava mai, lasciando wavePeriodS (e
  // di conseguenza waveEnergyKJ) silenziosamente null nelle condizioni live.
  test("ricade su best_match se ecmwf_wam025 ha l'altezza ma il periodo è sempre null", async () => {
    global.fetch = jest.fn((url) => {
      const u = String(url);
      if (u.includes("models=ecmwf_wam025")) {
        return Promise.resolve({ ok: true, json: async () => buildHourlyResponse({ height: 0.34, period: null }) });
      }
      return Promise.resolve({ ok: true, json: async () => buildHourlyResponse({ height: 0.3, period: 3.5 }) });
    });

    const { fetchOpenMeteoMarine } = require("./marineService");
    const result = await fetchOpenMeteoMarine(40.3, 18.4);

    expect(result.source).toBe("best_match");
    expect(result.wavePeriodS).toBe(3.5);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("ricade su best_match se ecmwf_wam025 non ha nemmeno l'altezza", async () => {
    global.fetch = jest.fn((url) => {
      const u = String(url);
      if (u.includes("models=ecmwf_wam025")) {
        return Promise.resolve({ ok: true, json: async () => ({ hourly: { time: [], wave_height: [] } }) });
      }
      return Promise.resolve({ ok: true, json: async () => buildHourlyResponse({ height: 1.1, period: 7 }) });
    });

    const { fetchOpenMeteoMarine } = require("./marineService");
    const result = await fetchOpenMeteoMarine(40.3, 18.4);

    expect(result.source).toBe("best_match");
    expect(result.waveHeightM).toBe(1.1);
  });
});
