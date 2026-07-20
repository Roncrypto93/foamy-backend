const {
  mergeMarineData,
  calculateWaveEnergyKJ,
  getDouglasSeaState,
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
