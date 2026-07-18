// Diferencial 2 — lógica pura de autopreenchimento e dica de progressão.
// Sem dependência de React: entra sets da última sessão, sai valores de campo
// e um texto de dica. Testável isolado em progression.test.ts.

export interface LastSet {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  duration: number | null;
}

export interface PrefillRow {
  weight: string;
  reps: string;
  duration: string;
}

export type Hint = { text: string } | null;

// ponytail: constantes de calibração — ajustar conforme o acervo de anilhas.
const STEP_KG = 2.5; // menor incremento montável (anilha padrão, 1,25kg/lado)
const PCT = 0.025; // alvo ~2,5% de aumento

// Próxima carga: ~PCT arredondado ao múltiplo de STEP_KG, com piso de STEP_KG.
// 20→22.5, 100→102.5, 200→205.
export function nextWeight(w: number): number {
  const inc = Math.max(STEP_KG, Math.round((w * PCT) / STEP_KG) * STEP_KG);
  return w + inc;
}

function num(n: number | null): string {
  // Remove zeros à direita (22.5 → "22.5", 20 → "20").
  return n == null ? "" : String(n);
}

// Mapeia os sets da última sessão para as linhas do template (por índice de
// série). Linhas além do histórico ficam vazias. Peso/reps só para força;
// duração só para tempo.
export function prefillSets(
  lastSets: LastSet[],
  templateSetCount: number,
  timed: boolean,
): PrefillRow[] {
  const bySetNumber = new Map(lastSets.map((s) => [s.setNumber, s]));
  return Array.from({ length: Math.max(1, templateSetCount) }, (_, i) => {
    const s = bySetNumber.get(i + 1);
    if (!s) return { weight: "", reps: "", duration: "" };
    return timed
      ? { weight: "", reps: "", duration: num(s.duration) }
      : { weight: num(s.weight), reps: num(s.reps), duration: "" };
  });
}

// Dica direcional (dupla progressão). Ver regra no plano.
export function computeHint(
  lastSets: LastSet[],
  repsMax: number | null,
  timed: boolean,
): Hint {
  if (lastSets.length === 0) return null; // sem histórico

  if (timed) {
    const durations = lastSets
      .map((s) => s.duration)
      .filter((d): d is number => d != null);
    if (durations.length === 0) return null;
    const best = Math.max(...durations);
    return { text: `Meta: supere os ${best}s da última vez.` };
  }

  if (repsMax == null) return null; // repetição sem faixa → sem dica

  const reps = lastSets
    .map((s) => s.reps)
    .filter((r): r is number => r != null);
  if (reps.length === 0) return null;

  const weights = lastSets
    .map((s) => s.weight)
    .filter((w): w is number => w != null);
  const lastWeight = weights.length ? Math.max(...weights) : null;

  const hitCeiling = reps.every((r) => r >= repsMax);
  if (hitCeiling && lastWeight != null) {
    return {
      text: `Mandou ${reps.length}×${repsMax}! Hora de subir: tente ${nextWeight(lastWeight)}kg.`,
    };
  }

  const withLoad = lastWeight != null ? ` com ${lastWeight}kg` : "";
  return { text: `Meta de hoje: chegue a ${repsMax} reps${withLoad}.` };
}
