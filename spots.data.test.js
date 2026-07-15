const SPOTS = require("./spots");

describe("Database spot Puglia", () => {
  test("contiene esattamente 19 spot come da specifica", () => {
    expect(SPOTS).toHaveLength(19);
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

  test.each(SPOTS.map((s) => [s.id, s]))("%s ha webcam_banner valido oppure esplicitamente assente (null)", (id, spot) => {
    if (spot.webcam_banner === null) return; // nessuna webcam affidabile trovata per questo spot
    expect(typeof spot.webcam_banner.provider).toBe("string");
    expect(spot.webcam_banner.url).toMatch(/^https?:\/\//);
    if (spot.webcam_banner.fallback) {
      expect(typeof spot.webcam_banner.note).toBe("string");
    }
  });

  test.each(SPOTS.map((s) => [s.id, s]))("%s appartiene a una costa valida", (id, spot) => {
    expect(["Adriatico", "Ionio", "Gargano"]).toContain(spot.coast);
  });

  test.each(SPOTS.map((s) => [s.id, s]))("%s ha spot_info completo (fondale, strutture, descrizione_tecnica)", (id, spot) => {
    expect(spot.spot_info).toBeDefined();
    expect(typeof spot.spot_info.fondale).toBe("string");
    expect(spot.spot_info.fondale.length).toBeGreaterThan(0);
    expect(typeof spot.spot_info.strutture).toBe("string");
    expect(spot.spot_info.strutture.length).toBeGreaterThan(0);
    expect(typeof spot.spot_info.descrizione_tecnica).toBe("string");
    expect(spot.spot_info.descrizione_tecnica.length).toBeGreaterThan(20);
  });
});
