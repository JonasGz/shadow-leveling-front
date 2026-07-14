import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  TriangleAlert,
  Inbox,
  ChevronLeft,
  Check,
  X,
  Trophy,
  type LucideIcon,
} from "lucide-react-native";
import { Button } from "../../../src/components/ui/Button";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { sessionsService } from "../../../src/services/sessions.service";
import { workoutsService } from "../../../src/services/workouts.service";
import { useWorkoutsStore } from "../../../src/stores/workouts.store";
import type {
  ExerciseSet,
  SessionStatus,
  WorkoutSessionDetail,
} from "../../../src/types/api.types";

// Espaçamento das labels em caixa alta: o design system zera todo tracking-*,
// então o valor do mock vem inline.
const TRACK = { letterSpacing: 0.5 };

const STATUS_META: Record<
  SessionStatus,
  { label: string; Icon: LucideIcon; color: string }
> = {
  complete: { label: "Concluído", Icon: Check, color: "#22C55E" },
  incomplete: { label: "Incompleto", Icon: TriangleAlert, color: "#F59E0B" },
  skipped: { label: "Pulado", Icon: X, color: "#EF4444" },
};

function fmtFull(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtSet(set: ExerciseSet) {
  return set.duration != null
    ? `${set.duration}s`
    : `${set.weight ?? 0}kg × ${set.reps ?? 0}`;
}

// Melhor série = maior carga; empate decidido por mais reps. Exercícios por
// tempo (sem peso) usam a maior duração.
function bestSetId(sets: ExerciseSet[]): string | null {
  const best = sets.reduce<ExerciseSet | null>((acc, s) => {
    if (!acc) return s;
    if (s.duration != null || acc.duration != null) {
      return (s.duration ?? 0) > (acc.duration ?? 0) ? s : acc;
    }
    const w = s.weight ?? 0;
    const bw = acc.weight ?? 0;
    if (w !== bw) return w > bw ? s : acc;
    return (s.reps ?? 0) > (acc.reps ?? 0) ? s : acc;
  }, null);
  return best?.id ?? null;
}

function statsOf(sets: ExerciseSet[]) {
  return sets.reduce(
    (acc, s) => ({
      series: acc.series + 1,
      reps: acc.reps + (s.reps ?? 0),
      volume: acc.volume + (s.weight ?? 0) * (s.reps ?? 0),
    }),
    { series: 0, reps: 0, volume: 0 },
  );
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workouts = useWorkoutsStore((s) => s.workouts);
  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [exerciseNames, setExerciseNames] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(false);
    try {
      const s = await sessionsService.get(id);
      setSession(s);
      // Os sets só trazem exercise_id; os nomes vêm do detalhe do treino.
      // Secundário: se falhar, cada card cai no rótulo genérico.
      const w = await workoutsService.get(s.workout_id).catch(() => null);
      setExerciseNames(
        Object.fromEntries(
          (w?.exercises ?? []).map((we) => [we.exercise_id, we.exercise.name]),
        ),
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const workoutName =
    workouts.find((w) => w.id === session?.workout_id)?.name ?? "Treino";

  // Agrupa sets por exercício
  const grouped = (session?.sets ?? []).reduce<Record<string, ExerciseSet[]>>(
    (acc, set) => {
      (acc[set.exercise_id] ??= []).push(set);
      return acc;
    },
    {},
  );

  const totals = statsOf(session?.sets ?? []);
  const status = session ? STATUS_META[session.status] : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Top App Bar (mesma da tela de workout) */}
      <View className="flex-row justify-between items-center px-md h-16">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="active:opacity-60"
        >
          <ChevronLeft size={22} color="#DCDCDD" />
        </Pressable>
        <Text className="text-title-lg text-white font-bold">Sessão</Text>
        {/* espaçador para manter o título centralizado */}
        <View className="w-[22px]" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c8a3ff" />
        </View>
      ) : error || !session || !status ? (
        <View className="flex-1 items-center justify-center px-lg gap-md">
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
          />
          <Button
            label="Tentar novamente"
            size="sm"
            onPress={() => {
              setLoading(true);
              load();
            }}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 py-md gap-3 pb-xl"
          showsVerticalScrollIndicator={false}
        >
          {/* Resumo */}
          <View className="bg-surface-low border border-card-border rounded-2xl p-[18px]">
            <Text className="text-title-lg font-bold text-on-surface">
              {workoutName}
            </Text>
            <Text className="text-body-md text-on-surface-variant mt-2">
              {fmtFull(session.date)}
            </Text>
            <View className="flex-row items-center gap-2 mt-3">
              <status.Icon size={15} color={status.color} strokeWidth={2.4} />
              <Text
                className="text-label-md font-bold uppercase text-secondary"
                style={TRACK}
              >
                {status.label}
              </Text>
            </View>
          </View>

          {/* Estatísticas da sessão */}
          <View className="flex-row gap-2.5">
            {[
              { value: totals.series, label: "Séries" },
              { value: totals.reps, label: "Reps" },
              { value: totals.volume, label: "kg vol." },
            ].map((stat) => (
              <View
                key={stat.label}
                className="flex-1 bg-surface-low border border-card-border rounded-xl p-3 items-center"
              >
                <Text className="text-title-xl font-extrabold text-on-surface">
                  {stat.value}
                </Text>
                <Text className="text-label-sm text-on-surface-variant mt-1">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {Object.keys(grouped).length === 0 ? (
            <View className="mt-md">
              <EmptyState
                icon={Inbox}
                title="Nenhuma série registrada"
                description="Esta sessão não teve séries registradas."
              />
            </View>
          ) : (
            Object.entries(grouped).map(([exerciseId, sets]) => {
              const ordered = sets
                .slice()
                .sort((a, b) => a.set_number - b.set_number);
              const bestId = bestSetId(ordered);
              const best = ordered.find((s) => s.id === bestId);
              return (
                <View
                  key={exerciseId}
                  className="bg-surface-low border border-card-border rounded-2xl p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-label-sm font-bold uppercase text-on-surface-variant"
                      style={TRACK}
                    >
                      Exercício
                    </Text>
                    <Text
                      className="text-label-md font-semibold text-on-surface flex-1 text-right ml-3"
                      numberOfLines={1}
                    >
                      {exerciseNames[exerciseId] ?? "Exercício"}
                    </Text>
                  </View>

                  <View className="gap-2 mt-3.5">
                    {ordered.map((set) => {
                      const isBest = set.id === bestId;
                      return (
                        <View
                          key={set.id}
                          className={`flex-row items-center justify-between rounded-xl px-3.5 py-3 ${
                            isBest
                              ? "bg-primary/10 border border-primary/35"
                              : "bg-background"
                          }`}
                        >
                          <View className="flex-row items-center gap-2">
                            {isBest ? (
                              <Trophy
                                size={14}
                                color="#CAA4FF"
                                strokeWidth={2}
                              />
                            ) : null}
                            <Text
                              className={`text-label-md font-semibold ${
                                isBest
                                  ? "text-primary-fixed-dim"
                                  : "text-on-surface-variant"
                              }`}
                            >
                              Série {set.set_number}
                            </Text>
                          </View>
                          <Text className="text-body-lg font-extrabold text-on-surface">
                            {fmtSet(set)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {best ? (
                    <View className="flex-row items-center gap-1.5 mt-3">
                      <Trophy size={13} color="#B26CFF" strokeWidth={2} />
                      <Text className="text-label-sm text-outline-variant">
                        Melhor série: {fmtSet(best)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
