import {
  computeHint,
  nextWeight,
  prefillSets,
  type LastSet,
} from "./progression";

const S = (
  setNumber: number,
  reps: number | null,
  weight: number | null,
  duration: number | null = null,
): LastSet => ({ setNumber, reps, weight, duration });

describe("nextWeight", () => {
  // Piso de 2,5kg e arredondamento ao múltiplo de 2,5.
  it("sobe ao próximo múltiplo de 2,5", () => {
    expect(nextWeight(20)).toBe(22.5);
    expect(nextWeight(100)).toBe(102.5);
    expect(nextWeight(200)).toBe(205);
  });
});

describe("prefillSets", () => {
  it("preenche série-a-série e deixa vazia a linha além do histórico", () => {
    expect(prefillSets([S(1, 10, 20), S(2, 10, 20)], 3, false)).toEqual([
      { weight: "20", reps: "10", duration: "" },
      { weight: "20", reps: "10", duration: "" },
      { weight: "", reps: "", duration: "" },
    ]);
  });

  it("usa duração em exercício de tempo", () => {
    expect(prefillSets([S(1, null, null, 45)], 1, true)).toEqual([
      { weight: "", reps: "", duration: "45" },
    ]);
  });
});

describe("computeHint", () => {
  it("sugere subir carga quando o teto da faixa foi batido", () => {
    const hint = computeHint(
      [S(1, 10, 20), S(2, 10, 20), S(3, 10, 20)],
      10,
      false,
    );
    expect(hint!.text).toMatch(/tente 22\.5kg/);
  });

  it("sugere meta de reps quando ficou abaixo do teto", () => {
    const hint = computeHint(
      [S(1, 10, 20), S(2, 10, 20), S(3, 8, 20)],
      10,
      false,
    );
    expect(hint!.text).toMatch(/chegue a 10 reps com 20kg/);
  });

  it("sugere superar a duração em exercício de tempo", () => {
    expect(computeHint([S(1, null, null, 45)], null, true)!.text).toMatch(
      /supere os 45s/,
    );
  });

  it("retorna null sem histórico ou sem faixa de reps", () => {
    expect(computeHint([], 10, false)).toBeNull();
    expect(computeHint([S(1, 10, 20)], null, false)).toBeNull();
  });
});
