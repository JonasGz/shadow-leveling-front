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
import {
  TriangleAlert,
  BookOpen,
  Shield,
  RefreshCw,
  Check,
  X,
  ChevronRight,
  Skull,
  type LucideIcon,
} from "lucide-react-native";
import { Button } from "../../src/components/ui/Button";
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
    d.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Espaçamento das labels em caixa alta: o design system zera todo tracking-*,
// então o valor do mock vem inline.
const TRACK = { letterSpacing: 0.5 };

const STATUS_META: Record<
  SessionStatus,
  { label: string; badge: string; text: string; Icon: LucideIcon; icon: string }
> = {
  complete: {
    label: "Concluído",
    badge: "bg-primary/15",
    text: "text-primary-fixed-dim",
    Icon: Check,
    icon: "#22C55E",
  },
  incomplete: {
    label: "Incompleto",
    badge: "bg-warning/15",
    text: "text-warning",
    Icon: TriangleAlert,
    icon: "#F59E0B",
  },
  skipped: {
    label: "Pulado",
    badge: "bg-error/15",
    text: "text-error",
    Icon: X,
    icon: "#EF4444",
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
    (id: string) => workouts.find((w) => w.id === id)?.name ?? "Treino",
    [workouts],
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
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
      setMissed(
        [...m].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
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
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-5 pt-2 pb-[112px]"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#c8a3ff"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-title-xxl font-bold text-on-surface">
            Histórico
          </Text>
          <Pressable
            onPress={onRefresh}
            disabled={refreshing}
            className="w-10 h-10 rounded-full border border-white/10 bg-surface-low items-center justify-center active:opacity-70"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#B26CFF" />
            ) : (
              <RefreshCw size={19} color="#B26CFF" />
            )}
          </Pressable>
        </View>

        {/* De / Até */}
        <View className="flex-row gap-2.5 mt-4">
          <View className="flex-1 bg-surface-low border border-white/10 rounded-lg px-3 py-2.5">
            <Text
              className="text-label-sm font-bold uppercase text-outline-variant"
              style={TRACK}
            >
              De
            </Text>
            <Text className="text-body-lg font-bold text-on-surface mt-2">
              {fmtDate(from.toISOString())}
            </Text>
          </View>
          <View className="flex-1 bg-surface-low border border-white/10 rounded-lg px-3 py-2.5">
            <Text
              className="text-label-sm font-bold uppercase text-outline-variant"
              style={TRACK}
            >
              Até
            </Text>
            <Text className="text-body-lg font-bold text-on-surface mt-2">
              {fmtDate(to.toISOString())}
            </Text>
          </View>
        </View>

        {/* Presets de período */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 mt-3"
        >
          {PRESETS.map((p) => {
            const active = p.key === preset;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPreset(p.key)}
                className={`rounded-full px-3.5 py-2 border ${
                  active ? "bg-primary" : "bg-transparent border-white/10"
                }`}
              >
                <Text
                  className={`text-label-md font-semibold ${
                    active ? "text-on-surface" : "text-on-surface-variant"
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
            <ActivityIndicator size="large" color="#c8a3ff" />
          </View>
        ) : error ? (
          <View className="items-center justify-center py-xl gap-md">
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
          <>
            {/* Sessões realizadas */}
            <Text
              className="text-label-sm font-bold uppercase text-on-surface-variant mt-6 mb-3"
              style={TRACK}
            >
              Treinos realizados
            </Text>

            {sessions.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Nenhuma sessão no período"
                description="Treine para registrar seu histórico."
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-3 pb-1"
              >
                {sessions.map((s) => {
                  const meta = STATUS_META[s.status];
                  const StatusIcon = meta.Icon;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => router.push(`/session/${s.id}`)}
                      className="w-[200px] bg-surface-low border border-card-border rounded-2xl p-4 active:opacity-80"
                    >
                      <View className="flex-row items-center justify-between">
                        <View
                          className={`px-2.5 py-1 rounded-full ${meta.badge}`}
                        >
                          <Text
                            className={`text-label-sm font-bold uppercase ${meta.text}`}
                            style={TRACK}
                          >
                            {meta.label}
                          </Text>
                        </View>
                        <Text className="text-label-sm text-outline-variant">
                          {fmtShort(s.date)}
                        </Text>
                      </View>

                      <Text
                        className="text-title-lg font-bold text-on-surface mt-3.5"
                        numberOfLines={1}
                      >
                        {workoutName(s.workout_id)}
                      </Text>

                      <View className="h-px bg-white/10 my-3.5" />

                      <View className="flex-row items-center justify-between">
                        <StatusIcon
                          size={16}
                          color={meta.icon}
                          strokeWidth={2.4}
                        />
                        <View className="flex-row items-center gap-1">
                          <Text
                            className="text-label-sm font-bold text-secondary"
                            style={TRACK}
                          >
                            VER DETALHES
                          </Text>
                          <ChevronRight
                            size={13}
                            color="#B26CFF"
                            strokeWidth={2.2}
                          />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Treinos perdidos */}
            <View className="flex-row items-center gap-2 mt-6 mb-3">
              <Skull size={16} color="#6c6971" strokeWidth={1.9} />
              <Text
                className="text-label-sm font-bold uppercase text-outline-variant"
                style={TRACK}
              >
                Treinos perdidos
              </Text>
            </View>

            {missed.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="Nenhum treino perdido"
                description="Sua disciplina está intacta no período."
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-3 pb-1"
              >
                {missed.map((m, i) => (
                  <View
                    key={`${m.workout_id}-${m.date}-${i}`}
                    className="w-[170px] bg-error/5 border border-card-border rounded-xl p-4"
                  >
                    <Text className="text-label-sm font-semibold text-outline-variant">
                      {fmtDate(m.date)}
                    </Text>
                    <Text
                      className="text-title-lg font-bold text-on-surface mt-2"
                      numberOfLines={1}
                    >
                      {m.workout_name}
                    </Text>
                    <Text
                      className="text-label-sm font-semibold uppercase text-error/80 mt-2.5"
                      style={TRACK}
                    >
                      Missão falhada
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
