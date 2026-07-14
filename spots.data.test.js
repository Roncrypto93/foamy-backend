const SPOTS = require("../src/data/spots");

describe("Database spot Puglia", () => {
  test("contiene esattamente 18 spot come da specifica", () => {
    expect(SPOTS).toHaveLength(18);
  });

  test("ogni spot ha id univoco", () => {
    const ids = SPOTS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test.each(SPOTS.map((s) => [s.id, s]))("%s ha coordinate valide per la Puglia", (id, spot) => {
    // Bounding box approssimativo della Puglia
    expect(spot.lat).toBeGreaterThan(39.5);
    expect(spot.lat).toBeLessThan(42.2);
    expect(spot.lon).toBeGreaterThan(14.5);
    expect(spot.lon).toBeLessThan(19);
  });

  test.each(SPOTS.map((s) => [s.id, s]))("%s ha almeno una disciplina valida", (id, spot) => {
    expect(spot.disciplines.length).toBeGreaterThan(0);
    spot.disciplines.forEach((d) => {
      expect(["wave", "wind", "kite"]).toContain(d);
    });
  });

  test.each(SPOTS.map((s) => [s.id, s]))("%s ha un webcam_banner con provider e url", (id, spot) => {
    expect(spot.webcam_banner).toBeDefined();
    expect(typeof spot.webcam_banner.provider).toBe("string");
    expect(spot.webcam_banner.url).toMatch(/^https?:\/\//);
  });

  test.each(SPOTS.map((s) => [s.id, s]))("%s appartiene a una costa valida", (id, spot) => {
    expect(["Adriatico", "Ionio", "Gargano"]).toContain(spot.coast);
  });
});
