import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { sessionsService } from "../../src/services/sessions.service";
import { useWorkoutsStore } from "../../src/stores/workouts.store";
import type {
  MissedWorkout,
  SessionStatus,
  WorkoutSession,
} from "../../src/types/api.types";

const MONTHS = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtShort(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const STATUS_META: Record<
  SessionStatus,
  { label: string; box: string; text: string; border: string }
> = {
  complete: {
    label: "Concluído",
    box: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
  },
  incomplete: {
    label: "Incompleto",
    box: "bg-tertiary/10",
    text: "text-tertiary",
    border: "border-tertiary/20",
  },
  skipped: {
    label: "Pulado",
    box: "bg-error/10",
    text: "text-error",
    border: "border-error/20",
  },
};

type Preset = "this_month" | "last_month" | "7d" | "30d";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "this_month", label: "Este mês" },
  { key: "last_month", label: "Mês passado" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
];

function rangeFor(preset: Preset): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  if (preset === "this_month") {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
  }
  if (preset === "last_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0),
    };
  }
  const days = preset === "7d" ? 7 : 30;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from, to };
}

export default function HistoryScreen() {
  const workouts = useWorkoutsStore((s) => s.workouts);
  const fetchWorkouts = useWorkoutsStore((s) => s.fetch);

  const [preset, setPreset] = useState<Preset>("this_month");
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [missed, setMissed] = useState<MissedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { from, to } = useMemo(() => rangeFor(preset), [preset]);

  const workoutName = useCallback(
    (id: string) =>
      workouts.find((w) => w.id === id)?.name ?? "Treino",
    [workouts]
  );

  const load = useCallback(async () => {
    setError(false);
    try {
      const [s, m] = await Promise.all([
        sessionsService.list({ from: toISODate(from), to: toISODate(to) }),
        sessionsService.missed({
          from: toISODate(from),
          to: toISODate(to),
        }),
      ]);
      // mais recentes primeiro
      setSessions(
        [...s].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
      setMissed(
        [...m].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (workouts.length === 0) fetchWorkouts();
  }, [workouts.length, fetchWorkouts]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-md h-16 border-b border-outline-variant">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-surface-highest border border-primary items-center justify-center">
            <Text className="text-primary text-base">⚡</Text>
          </View>
          <Text className="text-headline-mobile uppercase tracking-tight text-primary font-bold">
            Shadow Leveling
          </Text>
        </View>
        <Pressable className="w-10 h-10 items-center justify-center rounded-full active:opacity-60">
          <Text className="text-primary text-xl">◔</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="px-md pt-lg pb-[112px]"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#d0bcff"
          />
        }
      >
        {/* Título */}
        <Text className="text-display-md text-primary italic font-black tracking-tight mb-md">
          HISTÓRICO
        </Text>

        {/* Filtro DE / ATÉ */}
        <View className="flex-row gap-2 mb-md">
          <View className="flex-1 bg-surface-low border border-outline-variant rounded-lg p-3">
            <Text className="text-label-sm uppercase text-outline mb-1">
              De
            </Text>
            <Text className="text-title-md text-on-surface">
              {fmtDate(from.toISOString())}
            </Text>
          </View>
          <View className="flex-1 bg-surface-low border border-outline-variant rounded-lg p-3">
            <Text className="text-label-sm uppercase text-outline mb-1">
              Até
            </Text>
            <Text className="text-title-md text-on-surface">
              {fmtDate(to.toISOString())}
            </Text>
          </View>
        </View>

        {/* Presets de período */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 mb-lg"
        >
          {PRESETS.map((p) => {
            const active = p.key === preset;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPreset(p.key)}
                className={`rounded-full px-4 py-2 border ${
                  active
                    ? "bg-primary/15 border-primary"
                    : "bg-transparent border-outline-variant"
                }`}
              >
                <Text
                  className={`text-label-sm uppercase tracking-widest ${
                    active ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View className="items-center justify-center py-xl">
            <ActivityIndicator size="large" color="#d0bcff" />
          </View>
        ) : error ? (
          <View className="items-center justify-center py-xl gap-md">
            <EmptyState
              icon="⚠️"
              title="Não foi possível carregar"
              description="Verifique sua conexão e tente novamente."
            />
            <Pressable
              onPress={() => {
                setLoading(true);
                load();
              }}
              className="rounded bg-primary px-6 py-3 active:opacity-80"
            >
              <Text className="text-label-md uppercase tracking-widest text-on-primary font-semibold">
                Tentar novamente
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Sessões Realizadas */}
            <View className="mb-xl">
              <View className="flex-row justify-between items-center mb-md">
                <Text className="text-label-md uppercase tracking-widest text-on-surface-variant">
                  Sessões Realizadas
                </Text>
              </View>

              {sessions.length === 0 ? (
                <EmptyState
                  icon="📓"
                  title="Nenhuma sessão no período"
                  description="Treine para registrar seu histórico."
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-md pb-1"
                >
                  {sessions.map((s) => {
                    const meta = STATUS_META[s.status];
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() =>
                          router.push(`/session/${s.id}`)
                        }
                        className="w-[280px] bg-surface-container border border-outline-variant rounded-xl p-md gap-2 active:opacity-80"
                      >
                        <View className="flex-row justify-between items-start">
                          <View
                            className={`px-2 py-0.5 rounded border ${meta.box} ${meta.border}`}
                          >
                            <Text
                              className={`text-label-sm uppercase tracking-tight font-bold ${meta.text}`}
                            >
                              {meta.label}
                            </Text>
                          </View>
                          <Text className="text-label-sm text-outline">
                            {fmtShort(s.date)}
                          </Text>
                        </View>

                        <View className="mt-2">
                          <Text
                            className="text-headline-mobile text-on-surface leading-tight"
                            numberOfLines={2}
                          >
                            {workoutName(s.workout_id)}
                          </Text>
                        </View>

                        <View className="mt-4 pt-4 border-t border-outline-variant/30 flex-row justify-between items-center">
                          <Text className={`text-base ${meta.text}`}>
                            {s.status === "complete"
                              ? "✓"
                              : s.status === "incomplete"
                                ? "⚠"
                                : "✕"}
                          </Text>
                          <Text
                            className={`text-label-md uppercase ${meta.text}`}
                          >
                            Ver detalhes ›
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Treinos Perdidos */}
            <View className="mb-xl">
              <View className="flex-row items-center gap-2 mb-md">
                <Text className="text-error text-base">☠</Text>
                <Text className="text-label-md uppercase tracking-widest text-error">
                  Treinos Perdidos
                </Text>
              </View>

              {missed.length === 0 ? (
                <EmptyState
                  icon="🛡️"
                  title="Nenhum treino perdido"
                  description="Sua disciplina está intacta no período."
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-md pb-1"
                >
                  {missed.map((m, i) => (
                    <View
                      key={`${m.workout_id}-${m.date}-${i}`}
                      className="w-[240px] bg-error-container/10 border border-error/30 rounded-xl p-md overflow-hidden"
                    >
                      <Text className="text-label-sm text-error/80 mb-1">
                        {fmtDate(m.date)}
                      </Text>
                      <Text
                        className="text-title-md text-on-surface font-bold"
                        numberOfLines={2}
                      >
                        {m.workout_name}
                      </Text>
                      <Text className="text-label-sm text-error mt-4 uppercase tracking-widest">
                        Missão falhada
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}