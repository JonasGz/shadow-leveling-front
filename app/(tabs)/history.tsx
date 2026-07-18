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
import { router } from "expo-router";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import BookOpen from "lucide-react-native/icons/book-open";
import Shield from "lucide-react-native/icons/shield";
import RefreshCw from "lucide-react-native/icons/refresh-cw";
import Check from "lucide-react-native/icons/check";
import X from "lucide-react-native/icons/x";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import Skull from "lucide-react-native/icons/skull";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "../../src/components/ui/Button";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { sessionsService } from "../../src/services/sessions.service";
import { useWorkoutsStore } from "../../src/stores/workouts.store";
import { useScreenData } from "../../src/hooks/useScreenData";
import {
  formatDayMonth,
  formatDayMonthYear,
  toISODate,
} from "../../src/lib/date";
import type { SessionStatus } from "../../src/types/api.types";
import { color } from "../../src/theme/palette";
import { cn } from "../../src/lib/cn";

const STATUS_META: Record<
  SessionStatus,
  { label: string; badge: string; text: string; Icon: LucideIcon; icon: string }
> = {
  complete: {
    label: "Concluído",
    badge: "bg-purple-300/15",
    text: "text-purple-100",
    Icon: Check,
    icon: color.success,
  },
  incomplete: {
    label: "Incompleto",
    badge: "bg-warning/15",
    text: "text-warning",
    Icon: TriangleAlert,
    icon: color.warning,
  },
  skipped: {
    label: "Pulado",
    badge: "bg-error/15",
    text: "text-error",
    Icon: X,
    icon: color.error,
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

  const { from, to } = useMemo(() => rangeFor(preset), [preset]);

  const workoutName = useCallback(
    (id: string) => workouts.find((w) => w.id === id)?.name ?? "Treino",
    [workouts],
  );

  const {
    data,
    loading,
    error,
    refreshing,
    refresh: onRefresh,
    reload,
  } = useScreenData(async () => {
    const range = { from: toISODate(from), to: toISODate(to) };
    const [s, m] = await Promise.all([
      sessionsService.list(range),
      sessionsService.missed(range),
    ]);
    const mostRecentFirst = (a: { date: string }, b: { date: string }) =>
      new Date(b.date).getTime() - new Date(a.date).getTime();
    return {
      sessions: [...s].sort(mostRecentFirst),
      missed: [...m].sort(mostRecentFirst),
    };
  }, [preset]);

  const sessions = data?.sessions ?? [];
  const missed = data?.missed ?? [];

  useEffect(() => {
    if (workouts.length === 0) fetchWorkouts();
  }, [workouts.length, fetchWorkouts]);

  return (
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-5 pt-2 pb-[112px]"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={color["purple-100"]}
          />
        }
      >
        {/* Header */}
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-title-xxl font-bold text-white">Histórico</Text>
          <Pressable
            onPress={onRefresh}
            disabled={refreshing}
            className="h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-gray-600 active:opacity-70"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={color["purple-200"]} />
            ) : (
              <RefreshCw size={19} color={color["purple-200"]} />
            )}
          </Pressable>
        </View>

        {/* De / Até */}
        <View className="mt-4 flex-row gap-2.5">
          <View className="flex-1 rounded-lg border border-white/12 bg-gray-600 px-3 py-2.5">
            <Text className="text-label-sm font-bold uppercase tracking-label text-gray-300">
              De
            </Text>
            <Text className="mt-2 text-body-lg font-bold text-white">
              {formatDayMonthYear(from.toISOString())}
            </Text>
          </View>
          <View className="flex-1 rounded-lg border border-white/12 bg-gray-600 px-3 py-2.5">
            <Text className="text-label-sm font-bold uppercase tracking-label text-gray-300">
              Até
            </Text>
            <Text className="mt-2 text-body-lg font-bold text-white">
              {formatDayMonthYear(to.toISOString())}
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
                className={cn(
                  "rounded-full border px-3.5 py-2",
                  active ? "bg-purple-300" : "border-white/12 bg-transparent",
                )}
              >
                <Text
                  className={cn(
                    "text-label-md font-semibold",
                    active ? "text-white" : "text-gray-200",
                  )}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View className="items-center justify-center py-xl">
            <ActivityIndicator size="large" color={color["purple-100"]} />
          </View>
        ) : error ? (
          <View className="items-center justify-center gap-md py-xl">
            <EmptyState
              icon={TriangleAlert}
              title="Não foi possível carregar"
              description="Verifique sua conexão e tente novamente."
            />
            <Button label="Tentar novamente" size="sm" onPress={reload} />
          </View>
        ) : (
          <>
            {/* Sessões realizadas */}
            <Text className="mb-3 mt-6 text-label-sm font-bold uppercase tracking-label text-gray-200">
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
                      className="w-[200px] rounded-2xl border border-white/7 bg-gray-600 p-4 active:opacity-80"
                    >
                      <View className="flex-row items-center justify-between">
                        <View
                          className={cn("rounded-full px-2.5 py-1", meta.badge)}
                        >
                          <Text
                            className={cn(
                              "tracking-label",
                              "text-label-sm font-bold uppercase",
                              meta.text,
                            )}
                          >
                            {meta.label}
                          </Text>
                        </View>
                        <Text className="text-label-sm text-gray-300">
                          {formatDayMonth(s.date)}
                        </Text>
                      </View>

                      <Text
                        className="mt-3.5 text-title-lg font-bold text-white"
                        numberOfLines={1}
                      >
                        {workoutName(s.workout_id)}
                      </Text>

                      <View className="my-3.5 h-px bg-white/10" />

                      <View className="flex-row items-center justify-between">
                        <StatusIcon
                          size={16}
                          color={meta.icon}
                          strokeWidth={2.4}
                        />
                        <View className="flex-row items-center gap-1">
                          <Text className="text-label-sm font-bold tracking-label text-purple-200">
                            VER DETALHES
                          </Text>
                          <ChevronRight
                            size={13}
                            color={color["purple-200"]}
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
            <View className="mb-3 mt-6 flex-row items-center gap-2">
              <Skull size={16} color={color["gray-300"]} strokeWidth={1.9} />
              <Text className="text-label-sm font-bold uppercase tracking-label text-gray-300">
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
                    className="w-[170px] rounded-2xl border border-white/7 bg-error/5 p-4"
                  >
                    <Text className="text-label-sm font-semibold text-gray-300">
                      {formatDayMonthYear(m.date)}
                    </Text>
                    <Text
                      className="mt-2 text-title-lg font-bold text-white"
                      numberOfLines={1}
                    >
                      {m.workout_name}
                    </Text>
                    <Text className="mt-2.5 text-label-sm font-semibold uppercase tracking-label text-error/80">
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
