import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { sessionsService } from "../../../src/services/sessions.service";
import { useWorkoutsStore } from "../../../src/stores/workouts.store";
import type {
  ExerciseSet,
  SessionStatus,
  WorkoutSessionDetail,
} from "../../../src/types/api.types";

const STATUS_LABEL: Record<SessionStatus, { label: string; cls: string }> = {
  complete: { label: "Concluído", cls: "text-primary" },
  incomplete: { label: "Incompleto", cls: "text-tertiary" },
  skipped: { label: "Pulado", cls: "text-error" },
};

function fmtFull(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workouts = useWorkoutsStore((s) => s.workouts);
  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(false);
    try {
      setSession(await sessionsService.get(id));
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
    {}
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-md pt-md pb-sm flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="active:opacity-60">
          <Text className="text-body-md text-secondary font-semibold">
            ‹ Voltar
          </Text>
        </Pressable>
        <Text className="text-label-md uppercase tracking-widest text-on-surface-variant">
          Sessão
        </Text>
        <View className="w-12" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c8a3ff" />
        </View>
      ) : error || !session ? (
        <View className="flex-1 items-center justify-center px-lg gap-md">
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
        <ScrollView
          contentContainerClassName="px-md py-md gap-md pb-xl"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-surface-low border border-outline-variant rounded-md p-md gap-1">
            <Text className="text-headline-mobile text-on-surface font-bold">
              {workoutName}
            </Text>
            <Text className="text-body-md text-on-surface-variant">
              {fmtFull(session.date)}
            </Text>
            <Text
              className={`text-label-md uppercase tracking-widest mt-1 ${STATUS_LABEL[session.status].cls}`}
            >
              {STATUS_LABEL[session.status].label}
            </Text>
          </View>

          {Object.keys(grouped).length === 0 ? (
            <View className="mt-md">
              <EmptyState
                icon="📭"
                title="Nenhuma série registrada"
                description="Esta sessão não teve séries registradas."
              />
            </View>
          ) : (
            Object.entries(grouped).map(([exerciseId, sets]) => (
              <View
                key={exerciseId}
                className="bg-surface-container border border-outline-variant rounded-xl p-md gap-sm"
              >
                <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant">
                  Exercício
                </Text>
                {sets
                  .slice()
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((set) => (
                    <View
                      key={set.id}
                      className="flex-row items-center justify-between bg-surface-lowest rounded-lg px-md py-sm"
                    >
                      <Text className="text-label-md text-on-surface-variant">
                        Série {set.set_number}
                      </Text>
                      <Text className="text-title-md text-on-surface">
                        {set.duration != null
                          ? `${set.duration}s`
                          : `${set.weight ?? 0}kg × ${set.reps ?? 0}`}
                      </Text>
                    </View>
                  ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}