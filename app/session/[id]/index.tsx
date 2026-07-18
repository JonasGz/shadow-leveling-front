import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Inbox from "lucide-react-native/icons/inbox";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import Check from "lucide-react-native/icons/check";
import X from "lucide-react-native/icons/x";
import Trophy from "lucide-react-native/icons/trophy";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "../../../src/components/ui/Button";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { sessionsService } from "../../../src/services/sessions.service";
import { workoutsService } from "../../../src/services/workouts.service";
import { useWorkoutsStore } from "../../../src/stores/workouts.store";
import { formatFullDate } from "../../../src/lib/date";
import { TRACK } from "../../../src/lib/ui";
import type { ExerciseSet, SessionStatus } from "../../../src/types/api.types";
import { useScreenData } from "../../../src/hooks/useScreenData";
import { bestSetId, formatSet, statsOf } from "../../../src/features/sets";

const STATUS_META: Record<
  SessionStatus,
  { label: string; Icon: LucideIcon; color: string }
> = {
  complete: { label: "Concluído", Icon: Check, color: "#22C55E" },
  incomplete: { label: "Incompleto", Icon: TriangleAlert, color: "#F59E0B" },
  skipped: { label: "Pulado", Icon: X, color: "#EF4444" },
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workouts = useWorkoutsStore((s) => s.workouts);
  const { data, loading, error, reload } = useScreenData(async () => {
    if (!id) return null;
    const session = await sessionsService.get(id);
    // Os sets só trazem exercise_id; os nomes vêm do detalhe do treino.
    // Secundário: se falhar, cada card cai no rótulo genérico.
    const w = await workoutsService.get(session.workout_id).catch(() => null);
    const exerciseNames = Object.fromEntries(
      (w?.exercises ?? []).map((we) => [we.exercise_id, we.exercise.name]),
    );
    return { session, exerciseNames };
  }, [id]);

  const session = data?.session ?? null;
  const exerciseNames = data?.exerciseNames ?? {};

  const workoutName =
    workouts.find((w) => w.id === session?.workout_id)?.name ?? "Treino";

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
      <View className="h-16 flex-row items-center justify-between px-md">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="active:opacity-60"
        >
          <ChevronLeft size={22} color="#DCDCDD" />
        </Pressable>
        <Text className="text-title-lg font-bold text-white">Sessão</Text>
        {/* espaçador para manter o título centralizado */}
        <View className="w-[22px]" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c8a3ff" />
        </View>
      ) : error || !session || !status ? (
        <View className="flex-1 items-center justify-center gap-md px-lg">
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar novamente" size="sm" onPress={reload} />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-5 py-md gap-3 pb-xl"
          showsVerticalScrollIndicator={false}
        >
          {/* Resumo */}
          <View className="rounded-2xl border border-card-border bg-surface-low p-[18px]">
            <Text className="text-title-lg font-bold text-on-surface">
              {workoutName}
            </Text>
            <Text className="mt-2 text-body-md text-on-surface-variant">
              {formatFullDate(session.date)}
            </Text>
            <View className="mt-3 flex-row items-center gap-2">
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
                className="flex-1 items-center rounded-xl border border-card-border bg-surface-low p-3"
              >
                <Text className="text-title-xl font-extrabold text-on-surface">
                  {stat.value}
                </Text>
                <Text className="mt-1 text-label-sm text-on-surface-variant">
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
                  className="rounded-2xl border border-card-border bg-surface-low p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-label-sm font-bold uppercase text-on-surface-variant"
                      style={TRACK}
                    >
                      Exercício
                    </Text>
                    <Text
                      className="ml-3 flex-1 text-right text-label-md font-semibold text-on-surface"
                      numberOfLines={1}
                    >
                      {exerciseNames[exerciseId] ?? "Exercício"}
                    </Text>
                  </View>

                  <View className="mt-3.5 gap-2">
                    {ordered.map((set) => {
                      const isBest = set.id === bestId;
                      return (
                        <View
                          key={set.id}
                          className={`flex-row items-center justify-between rounded-xl px-3.5 py-3 ${
                            isBest
                              ? "border border-primary/35 bg-primary/10"
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
                            {formatSet(set)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {best ? (
                    <View className="mt-3 flex-row items-center gap-1.5">
                      <Trophy size={13} color="#B26CFF" strokeWidth={2} />
                      <Text className="text-label-sm text-outline-variant">
                        Melhor série: {formatSet(best)}
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
