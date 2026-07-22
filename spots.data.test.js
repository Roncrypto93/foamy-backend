const SPOTS = require("./spots");

// Coste valide per regione: "Ionio" è condiviso (Salento ionico in Puglia,
// costa orientale in Sicilia) ma le due liste restano separate così un
// refuso (es. uno spot Sicilia con coast "Gargano") viene beccato subito.
const VALID_COAST_BY_REGION = {
  Puglia: ["Adriatico", "Ionio", "Gargano"],
  Sicilia: ["Tirreno", "Ionio", "Canale di Sicilia"],
  "Emilia-Romagna": ["Adriatico"],
};

// Bounding box approssimativi, larghi apposta (includono mare antistante,
// non solo terraferma) — servono solo a beccare un lat/lon invertito o in
// un altro continente, non a validare la precisione della stima.
const BOUNDING_BOX_BY_REGION = {
  Puglia: { latMin: 39.5, latMax: 42.2, lonMin: 14.5, lonMax: 19 },
  Sicilia: { latMin: 36.4, latMax: 38.6, lonMin: 12.3, lonMax: 15.7 },
  "Emilia-Romagna": { latMin: 43.8, latMax: 44.7, lonMin: 12.1, lonMax: 12.9 },
};

describe("Database spot Puglia + Sicilia + Emilia-Romagna", () => {
  test("contiene esattamente 97 spot (20 Puglia + 57 Sicilia + 20 Emilia-Romagna)", () => {
    expect(SPOTS).toHaveLength(97);
    expect(SPOTS.filter((s) => s.region === "Puglia")).toHaveLength(20);
    expect(SPOTS.filter((s) => s.region === "Sicilia")).toHaveLength(57);
    expect(SPOTS.filter((s) => s.region === "Emilia-Romagna")).toHaveLength(20);
  });

  test("ogni spot ha id univoco", () => {
    const ids = SPOTS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test.each(SPOTS.map((s) => [s.id, s]))("%s ha una region valida (Puglia, Sicilia o Emilia-Romagna)", (id, spot) => {
    expect(["Puglia", "Sicilia", "Emilia-Romagna"]).toContain(spot.region);
  });

  test.each(SPOTS.map((s) => [s.id, s]))("%s ha coordinate plausibili per la sua region", (id, spot) => {
    const box = BOUNDING_BOX_BY_REGION[spot.region];
    expect(spot.lat).toBeGreaterThan(box.latMin);
    expect(spot.lat).toBeLessThan(box.latMax);
    expect(spot.lon).toBeGreaterThan(box.lonMin);
    expect(spot.lon).toBeLessThan(box.lonMax);
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

  test.each(SPOTS.map((s) => [s.id, s]))("%s appartiene a una costa valida per la sua region", (id, spot) => {
    expect(VALID_COAST_BY_REGION[spot.region]).toContain(spot.coast);
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

  // Sicilia ed Emilia-Romagna hanno coordsSource (Puglia non lo ha mai
  // avuto, le sue coordinate sono già state verificate in una sessione
  // precedente).
  test.each(
    SPOTS.filter((s) => s.region === "Sicilia" || s.region === "Emilia-Romagna").map((s) => [s.id, s])
  )("%s dichiara la fonte delle coordinate (surfline o estimate)", (id, spot) => {
    expect(["surfline", "estimate"]).toContain(spot.coordsSource);
  });

  // coastOrientationDeg serve a calculateSurfRating() (waveCalculations.js)
  // per capire se il vento è offshore/cross/onshore — solo Puglia per ora.
  // Non testiamo un valore preciso (sono stime, non misurazioni), solo che
  // il campo esista ed sia un numero 0-360 plausibile, così un refuso tipo
  // "Otranto mancante dalla lista" (già capitato una volta) viene beccato.
  test.each(SPOTS.filter((s) => s.region === "Puglia").map((s) => [s.id, s]))(
    "%s (Puglia) ha coastOrientationDeg valido (0-360°)",
    (id, spot) => {
      expect(typeof spot.coastOrientationDeg).toBe("number");
      expect(spot.coastOrientationDeg).toBeGreaterThanOrEqual(0);
      expect(spot.coastOrientationDeg).toBeLessThanOrEqual(360);
    }
  );
});
