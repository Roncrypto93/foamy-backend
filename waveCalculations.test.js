const {
  mergeMarineData,
  calculateWaveEnergyKJ,
  getDouglasSeaState,
  calculateSurfRating,
} = require("./waveCalculations");

describe("mergeMarineData", () => {
  test("calcola la media aritmetica di altezza e periodo tra le due fonti", () => {
    const openMeteo = { waveHeightM: 1.0, wavePeriodS: 6.0, waveDirectionDeg: 90 };
    const copernicus = { waveHeightM: 1.4, wavePeriodS: 7.0, waveDirectionDeg: 100 };

    const result = mergeMarineData(openMeteo, copernicus);

    expect(result.waveHeightM).toBeCloseTo(1.2, 5);
    expect(result.wavePeriodS).toBeCloseTo(6.5, 5);
  });

  test("dà priorità al dato Copernicus per la direzione onda quando presente", () => {
    const openMeteo = { waveHeightM: 1, wavePeriodS: 6, waveDirectionDeg: 90 };
    const copernicus = { waveHeightM: 1, wavePeriodS: 6, waveDirectionDeg: 200 };

    const result = mergeMarineData(openMeteo, copernicus);

    expect(result.waveDirectionDeg).toBe(200);
  });

  test("usa la direzione Open-Meteo come fallback se Copernicus non è disponibile", () => {
    const openMeteo = { waveHeightM: 1, wavePeriodS: 6, waveDirectionDeg: 90 };
    const copernicus = { waveHeightM: null, wavePeriodS: null, waveDirectionDeg: null };

    const result = mergeMarineData(openMeteo, copernicus);

    expect(result.waveDirectionDeg).toBe(90);
    // altezza/periodo: con una fonte nulla, la media collassa sull'altra fonte disponibile
    expect(result.waveHeightM).toBe(1);
    expect(result.wavePeriodS).toBe(6);
  });

  test("gestisce entrambe le fonti nulle senza lanciare eccezioni", () => {
    const empty = { waveHeightM: null, wavePeriodS: null, waveDirectionDeg: null };
    const result = mergeMarineData(empty, empty);

    expect(result.waveHeightM).toBeNull();
    expect(result.wavePeriodS).toBeNull();
    expect(result.waveDirectionDeg).toBeNull();
  });
});

describe("calculateWaveEnergyKJ", () => {
  test("applica correttamente la formula Energia = altezza^2 * periodo * 10", () => {
    // 1^2 * 8 * 10 = 80
    expect(calculateWaveEnergyKJ(1, 8)).toBe(80);
    // 2^2 * 6 * 10 = 240
    expect(calculateWaveEnergyKJ(2, 6)).toBe(240);
  });

  test("arrotonda il risultato a numero intero", () => {
    // 1.3^2 * 7.4 * 10 = 125.06 -> 125
    expect(calculateWaveEnergyKJ(1.3, 7.4)).toBe(125);
  });

  test("restituisce null se manca altezza o periodo", () => {
    expect(calculateWaveEnergyKJ(null, 8)).toBeNull();
    expect(calculateWaveEnergyKJ(1, null)).toBeNull();
  });

  test("onda piatta (altezza 0) produce energia 0", () => {
    expect(calculateWaveEnergyKJ(0, 8)).toBe(0);
  });
});

describe("getDouglasSeaState", () => {
  test.each([
    [0.05, "Forza 1 - Quasi Calmo"],
    [0.3, "Forza 2 - Poco Mosso"],
    [0.8, "Forza 3 - Mosso"],
    [2.0, "Forza 4 - Molto Mosso"],
    [3.5, "Forza 5 - Agitato"],
  ])("mappa altezza %sm sullo stato di mare corretto", (height, expected) => {
    expect(getDouglasSeaState(height)).toBe(expected);
  });

  test("gestisce correttamente i valori esattamente sui confini della scala", () => {
    expect(getDouglasSeaState(0.1)).toBe("Forza 2 - Poco Mosso");
    expect(getDouglasSeaState(0.5)).toBe("Forza 3 - Mosso");
    expect(getDouglasSeaState(1.25)).toBe("Forza 4 - Molto Mosso");
    expect(getDouglasSeaState(2.5)).toBe("Forza 5 - Agitato");
  });

  test("restituisce N/D se l'altezza è null o undefined", () => {
    expect(getDouglasSeaState(null)).toBe("N/D");
    expect(getDouglasSeaState(undefined)).toBe("N/D");
  });
});

describe("calculateSurfRating", () => {
  // coastOrientationDeg 90 (E) → offshore = 270 (W), per isolare i test
  // sulla zona vento da un valore di comodo facile da ragionare a mente.
  const COAST_E = 90;
  const OFFSHORE_FOR_COAST_E = 270;

  describe("tabella base (altezza x periodo)", () => {
    test.each([
      // altezza, periodo, livello atteso
      [0.1, 3, "Scarsa"], // <0.3m, <4s
      [0.1, 8, "Discreta"], // <0.3m, 7-9s
      [0.1, 10, "Buona"], // <0.3m, >9s
      [0.4, 6, "Discreta"], // 0.3-0.5m, 5.5-7s
      [0.6, 5, "Discreta"], // 0.5-0.8m, 4-5.5s
      [0.6, 6, "Buona"], // 0.5-0.8m, 5.5-7s
      [1.0, 8, "Ottima"], // 0.8-1.2m, 7-9s
      [1.5, 4, "Buona"], // >1.2m, 4-5.5s
    ])("altezza %sm, periodo %ss -> livello base %s (nessun vento fornito)", (h, p, expected) => {
      const result = calculateSurfRating(h, p, null, null, null);
      expect(result.baseLevel).toBe(expected);
      expect(result.rating).toBe(expected);
      expect(result.windEffect).toBe("unavailable");
    });

    test("confini esatti altezza: 0.3/0.5/0.8/1.2 cadono nella fascia superiore (limite incluso)", () => {
      // Stesso periodo (5s, fascia "4-5.5s") per isolare solo il confine altezza.
      expect(calculateSurfRating(0.3, 5, null, null, null).baseLevel).toBe("Discreta"); // entra in "0.3-0.5m", non più "<0.3m"
      expect(calculateSurfRating(0.5, 5, null, null, null).baseLevel).toBe("Discreta"); // entra in "0.5-0.8m", non "0.3-0.5m"
      expect(calculateSurfRating(0.8, 5, null, null, null).baseLevel).toBe("Buona");
      expect(calculateSurfRating(1.2, 5, null, null, null).baseLevel).toBe("Buona");
    });

    test("confini esatti periodo: 4/5.5/7/9 cadono nella fascia superiore (limite incluso)", () => {
      // Stessa altezza (0.6m, fascia "0.5-0.8m") per isolare solo il confine periodo.
      expect(calculateSurfRating(0.6, 4, null, null, null).baseLevel).toBe("Discreta");
      expect(calculateSurfRating(0.6, 5.5, null, null, null).baseLevel).toBe("Buona");
      expect(calculateSurfRating(0.6, 7, null, null, null).baseLevel).toBe("Ottima");
      expect(calculateSurfRating(0.6, 9, null, null, null).baseLevel).toBe("Ottima");
    });
  });

  describe("dati mancanti: mai un crash", () => {
    test("altezza o periodo mancanti -> rating e baseLevel null, windEffect unavailable", () => {
      expect(calculateSurfRating(null, 6, 10, 90, 90)).toEqual({ rating: null, baseLevel: null, windEffect: "unavailable" });
      expect(calculateSurfRating(0.6, null, 10, 90, 90)).toEqual({ rating: null, baseLevel: null, windEffect: "unavailable" });
    });

    test("vento o coastOrientationDeg mancanti -> solo livello base, windEffect unavailable", () => {
      const withoutWind = calculateSurfRating(0.6, 6, null, null, null);
      expect(withoutWind).toEqual({ rating: "Buona", baseLevel: "Buona", windEffect: "unavailable" });

      const withoutOrientation = calculateSurfRating(0.6, 6, 10, 90, null);
      expect(withoutOrientation).toEqual({ rating: "Buona", baseLevel: "Buona", windEffect: "unavailable" });
    });
  });

  describe("zona vento rispetto alla costa (confini a 45°/90°/135°)", () => {
    // Altezza/periodo fissi con baseLevel "Ottima" (1.0m, 6s -> 0.8-1.2m x
    // 5.5-7s), così bump/tetto sono entrambi ben visibili sul risultato.
    test.each([
      [0, "bump"], // offshore esatto (delta 0)
      [45, "bump"], // confine offshore incluso
      [46, "bump"], // cross-offshore, 5-15kn -> bump comunque
      [90, "bump"], // confine cross-offshore incluso, 5-15kn
      [91, "none"], // cross-onshore appena oltre, 5-15kn -> nessuna modifica
      [135, "none"], // confine cross-onshore incluso, 5-15kn
      [136, "none"], // onshore appena oltre, 5-15kn -> nessuna modifica (stesso di cross-onshore)
      [180, "none"], // onshore pieno, 5-15kn
    ])("delta %s° dall'offshore, vento 10kn -> windEffect %s", (delta, expectedEffect) => {
      const windDirectionDeg = (OFFSHORE_FOR_COAST_E + delta) % 360;
      const result = calculateSurfRating(1.0, 6, 10, windDirectionDeg, COAST_E);
      expect(result.baseLevel).toBe("Ottima");
      expect(result.windEffect).toBe(expectedEffect);
    });

    test("stesso delta ma vento >15kn: cross-offshore (46°) passa da bump a none, cross-onshore/onshore (91°-180°) passano da none a cap", () => {
      const crossOffshore = calculateSurfRating(1.0, 6, 20, (OFFSHORE_FOR_COAST_E + 46) % 360, COAST_E);
      expect(crossOffshore.windEffect).toBe("none");
      expect(crossOffshore.rating).toBe("Ottima");

      const crossOnshore = calculateSurfRating(1.0, 6, 20, (OFFSHORE_FOR_COAST_E + 91) % 360, COAST_E);
      expect(crossOnshore.windEffect).toBe("cap");
      expect(crossOnshore.rating).toBe("Buona");

      const onshore = calculateSurfRating(1.0, 6, 20, (OFFSHORE_FOR_COAST_E + 180) % 360, COAST_E);
      expect(onshore.windEffect).toBe("cap");
      expect(onshore.rating).toBe("Buona");
    });
  });

  describe("confini soglia vento (5kn / 15kn)", () => {
    test("< 5kn: bump garantito qualsiasi direzione, anche pieno onshore", () => {
      const fullOnshore = (OFFSHORE_FOR_COAST_E + 180) % 360;
      const result = calculateSurfRating(1.0, 6, 4.9, fullOnshore, COAST_E);
      expect(result.baseLevel).toBe("Ottima");
      expect(result.windEffect).toBe("bump");
      expect(result.rating).toBe("Perfetto");
    });

    test("esattamente 5kn onshore: nessuna modifica (rientra nella fascia 5-15)", () => {
      const fullOnshore = (OFFSHORE_FOR_COAST_E + 180) % 360;
      const result = calculateSurfRating(1.0, 6, 5, fullOnshore, COAST_E);
      expect(result.windEffect).toBe("none");
    });

    test("esattamente 15kn onshore: ancora nessuna modifica (limite superiore incluso nella fascia 5-15)", () => {
      const fullOnshore = (OFFSHORE_FOR_COAST_E + 180) % 360;
      const result = calculateSurfRating(1.0, 6, 15, fullOnshore, COAST_E);
      expect(result.windEffect).toBe("none");
    });

    test("appena sopra 15kn onshore: scatta il tetto", () => {
      const fullOnshore = (OFFSHORE_FOR_COAST_E + 180) % 360;
      const result = calculateSurfRating(1.0, 6, 15.1, fullOnshore, COAST_E);
      expect(result.windEffect).toBe("cap");
      expect(result.rating).toBe("Buona");
    });
  });

  describe("regole speciali su Scarsa/Perfetto", () => {
    test("Scarsa non viene mai modificata, anche con vento offshore calmo (bump teorico bloccato)", () => {
      const result = calculateSurfRating(0.1, 3, 3, OFFSHORE_FOR_COAST_E, COAST_E); // <5kn -> bump teorico
      expect(result.baseLevel).toBe("Scarsa");
      expect(result.rating).toBe("Scarsa");
      expect(result.windEffect).toBe("none"); // il bump non ha avuto alcun effetto reale
    });

    test("Perfetto è raggiungibile solo tramite bump, mai dalla tabella base da sola", () => {
      // Non esiste alcuna cella della tabella base che valga "Perfetto".
      for (let h = 0; h < 2; h += 0.1) {
        for (let p = 1; p < 12; p += 0.5) {
          expect(calculateSurfRating(h, p, null, null, null).baseLevel).not.toBe("Perfetto");
        }
      }
    });

    test("un tetto che non abbassa nulla (baseLevel già <= Buona) riporta windEffect none, non cap", () => {
      // 0.6m/6s -> baseLevel "Buona", già uguale al tetto: il cap non cambia nulla.
      const fullOnshore = (OFFSHORE_FOR_COAST_E + 180) % 360;
      const result = calculateSurfRating(0.6, 6, 20, fullOnshore, COAST_E);
      expect(result.baseLevel).toBe("Buona");
      expect(result.rating).toBe("Buona");
      expect(result.windEffect).toBe("none");
    });
  });

  describe("i 3 casi di verifica finale concordati con l'utente", () => {
    test("caso 1: 0.5m / 5s / offshore >=5kn -> base Discreta, bump a Buona", () => {
      // coastOrientationDeg 0 (N) -> offshore 180 (S): vento da 180° è offshore puro (delta 0).
      const result = calculateSurfRating(0.5, 5, 10, 180, 0);
      expect(result.baseLevel).toBe("Discreta");
      expect(result.windEffect).toBe("bump");
      expect(result.rating).toBe("Buona");
    });

    test("caso 2: 1m / ~6s / onshore forte (>15kn) -> Buona, il tetto interviene (non Ottima)", () => {
      // coastOrientationDeg 0 (N) -> onshore = vento da 0° (N), pieno onshore.
      const result = calculateSurfRating(1, 6, 20, 0, 0);
      expect(result.baseLevel).toBe("Ottima");
      expect(result.windEffect).toBe("cap");
      expect(result.rating).toBe("Buona");
    });

    test("caso 3: 0.2m / 3s / vento calmo <5kn -> resta Scarsa (il bump non si applica: Scarsa è protetta)", () => {
      const result = calculateSurfRating(0.2, 3, 3, 0, 0);
      expect(result.baseLevel).toBe("Scarsa");
      expect(result.rating).toBe("Scarsa");
    });
  });
});
