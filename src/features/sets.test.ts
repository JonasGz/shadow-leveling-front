import {
  bestSetId,
  buildSessionSummary,
  formatSet,
  statsOf,
} from "./sets";
import type { ExerciseSet } from "../types/api.types";

const set = (over: Partial<ExerciseSet> & { id: string }): ExerciseSet =>
  ({
    exercise_id: "ex1",
    set_number: 1,
    reps: null,
    weight: null,
    duration: null,
    ...over,
  }) as ExerciseSet;

describe("formatSet", () => {
  it("mostra duração em exercício de tempo", () => {
    expect(formatSet(set({ id: "a", duration: 45 }))).toBe("45s");
  });

  it("mostra carga × reps, tratando nulos como zero", () => {
    expect(formatSet(set({ id: "a", weight: 80, reps: 10 }))).toBe("80kg × 10");
    expect(formatSet(set({ id: "a" }))).toBe("0kg × 0");
  });
});

describe("statsOf", () => {
  it("soma séries, reps e volume", () => {
    expect(
      statsOf([
        set({ id: "a", weight: 100, reps: 10 }),
        set({ id: "b", weight: 90, reps: 8 }),
      ]),
    ).toEqual({ series: 2, reps: 18, volume: 1720 });
  });

  it("ignora nulos sem virar NaN", () => {
    expect(statsOf([set({ id: "a", duration: 30 })])).toEqual({
      series: 1,
      reps: 0,
      volume: 0,
    });
  });

  it("lista vazia zera", () => {
    expect(statsOf([])).toEqual({ series: 0, reps: 0, volume: 0 });
  });
});

describe("bestSetId", () => {
  it("escolhe o maior volume, não a maior carga", () => {
    const best = bestSetId([
      set({ id: "leve", weight: 80, reps: 10 }), // volume 800
      set({ id: "pesada", weight: 100, reps: 5 }), // volume 500
    ]);
    expect(best).toBe("leve");
  });

  it("com carga igual, mais reps vence (volume maior)", () => {
    const best = bestSetId([
      set({ id: "a", weight: 100, reps: 8 }),
      set({ id: "b", weight: 100, reps: 12 }),
    ]);
    expect(best).toBe("b");
  });

  it("usa duração em exercício de tempo", () => {
    const best = bestSetId([
      set({ id: "a", duration: 30 }),
      set({ id: "b", duration: 50 }),
    ]);
    expect(best).toBe("b");
  });

  it("empate fica com a primeira série", () => {
    const best = bestSetId([
      set({ id: "primeira", weight: 100, reps: 10 }),
      set({ id: "segunda", weight: 50, reps: 20 }), // mesmo volume
    ]);
    expect(best).toBe("primeira");
  });

  it("retorna null para lista vazia", () => {
    expect(bestSetId([])).toBeNull();
  });
});

describe("buildSessionSummary", () => {
  const nameOf = (id: string) => (id === "ex1" ? "Supino" : "Prancha");
  const isTimeOf = (id: string) => id === "ex2";

  it("agrupa por exercício e soma o volume total", () => {
    const { summaries, totalVolume } = buildSessionSummary(
      [
        set({ id: "a", exercise_id: "ex1", weight: 100, reps: 10 }),
        set({ id: "b", exercise_id: "ex1", weight: 80, reps: 12 }),
        set({ id: "c", exercise_id: "ex2", duration: 60 }),
      ],
      nameOf,
      isTimeOf,
    );

    expect(totalVolume).toBe(1960); // 1000 + 960 + 0
    expect(summaries).toHaveLength(2);

    const supino = summaries.find((s) => s.exerciseId === "ex1")!;
    expect(supino.name).toBe("Supino");
    expect(supino.isTime).toBe(false);
    expect(supino.setsCount).toBe(2);
    // Pontua por volume: 100×10=1000 vence 80×12=960.
    expect(supino.bestWeight).toBe(100);
    expect(supino.bestReps).toBe(10);

    const prancha = summaries.find((s) => s.exerciseId === "ex2")!;
    expect(prancha.isTime).toBe(true);
    expect(prancha.bestDuration).toBe(60);
  });

  it("lista vazia não gera resumo nem volume", () => {
    expect(buildSessionSummary([], nameOf, isTimeOf)).toEqual({
      summaries: [],
      totalVolume: 0,
    });
  });

  // Trava a regressão: detalhe da sessão e resumo pós-treino devem destacar a
  // MESMA série. Antes cada tela tinha seu próprio critério e discordavam.
  it("concorda com bestSetId quando volume e carga apontam séries diferentes", () => {
    const sets = [
      set({ id: "pesada", exercise_id: "ex1", weight: 100, reps: 5 }), // vol 500
      set({ id: "volumosa", exercise_id: "ex1", weight: 60, reps: 12 }), // vol 720
    ];

    const destaqueDetalhe = bestSetId(sets);
    const resumo = buildSessionSummary(sets, nameOf, isTimeOf).summaries[0];

    expect(destaqueDetalhe).toBe("volumosa");
    expect(resumo.bestWeight).toBe(60);
    expect(resumo.bestReps).toBe(12);
  });
});
