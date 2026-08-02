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

const STEP_KG = 2.5;
const PCT = 0.025;

export function nextWeight(w: number): number {
  const inc = Math.max(STEP_KG, Math.round((w * PCT) / STEP_KG) * STEP_KG);
  return w + inc;
}

function num(n: number | null): string {
  return n == null ? "" : String(n);
}

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

export function computeHint(
  lastSets: LastSet[],
  repsMax: number | null,
  timed: boolean,
): Hint {
  if (lastSets.length === 0) return null;

  if (timed) {
    const durations = lastSets
      .map((s) => s.duration)
      .filter((d): d is number => d != null);
    if (durations.length === 0) return null;
    const best = Math.max(...durations);
    return { text: `Meta: supere os ${best}s da última vez.` };
  }

  if (repsMax == null) return null;

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
