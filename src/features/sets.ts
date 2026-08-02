import type { ExerciseSet } from "../types/api.types";

export interface ExerciseSummary {
  exerciseId: string;
  name: string;
  isTime: boolean;
  setsCount: number;
  bestWeight: number | null;
  bestReps: number | null;
  bestDuration: number | null;
}

export interface SetStats {
  series: number;
  reps: number;
  volume: number;
}

export function formatSet(set: ExerciseSet): string {
  return set.duration != null
    ? `${set.duration}s`
    : `${set.weight ?? 0}kg × ${set.reps ?? 0}`;
}

export function statsOf(sets: ExerciseSet[]): SetStats {
  return sets.reduce<SetStats>(
    (acc, s) => ({
      series: acc.series + 1,
      reps: acc.reps + (s.reps ?? 0),
      volume: acc.volume + volumeOf(s),
    }),
    { series: 0, reps: 0, volume: 0 },
  );
}

export function volumeOf(set: ExerciseSet): number {
  return (set.weight ?? 0) * (set.reps ?? 0);
}

function scoreOf(set: ExerciseSet): number {
  return set.duration != null ? set.duration : volumeOf(set);
}

export function bestSetOf(sets: ExerciseSet[]): ExerciseSet | null {
  let best: ExerciseSet | null = null;
  let bestScore = -1;
  for (const s of sets) {
    const score = scoreOf(s);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

export function bestSetId(sets: ExerciseSet[]): string | null {
  return bestSetOf(sets)?.id ?? null;
}

export function buildSessionSummary(
  sets: ExerciseSet[],
  nameOf: (id: string) => string,
  isTimeOf: (id: string) => boolean,
): { summaries: ExerciseSummary[]; totalVolume: number } {
  const byExercise: Record<string, ExerciseSet[]> = {};
  for (const s of sets) (byExercise[s.exercise_id] ??= []).push(s);

  let totalVolume = 0;
  const summaries = Object.entries(byExercise).map(([exerciseId, list]) => {
    for (const s of list) totalVolume += volumeOf(s);
    const best = bestSetOf(list);
    return {
      exerciseId,
      name: nameOf(exerciseId),
      isTime: isTimeOf(exerciseId),
      setsCount: list.length,
      bestWeight: best?.weight ?? null,
      bestReps: best?.reps ?? null,
      bestDuration: best?.duration ?? null,
    };
  });

  return { summaries, totalVolume };
}
