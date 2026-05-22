import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { workoutsService } from "../../../src/services/workouts.service";
import { useWorkoutsStore } from "../../../src/stores/workouts.store";
import type {
  DayOfWeek,
  Workout,
  WorkoutExercise,
} from "../../../src/types/api.types";

const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: "DOM",
  monday: "SEG",
  tuesday: "TER",
  wednesday: "QUA",
  thursday: "QUI",
  friday: "SEX",
  saturday: "SÁB",
};

const DAY_INDEX: Record<number, DayOfWeek> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function repsLabel(ex: WorkoutExercise): string {
  if (ex.exercise.type === "time") {
    return ex.duration ? `${ex.sets} x ${ex.duration}s` : `${ex.sets} séries`;
  }
  if (ex.reps_min != null && ex.reps_max != null) {
    return ex.reps_min === ex.reps_max
      ? `${ex.sets} x ${ex.reps_min}`
      : `${ex.sets} x ${ex.reps_min}-${ex.reps_max}`;
  }
  if (ex.reps_min != null) return `${ex.sets} x ${ex.reps_min}`;
  return `${ex.sets} séries`;
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "secondary" | "tertiary" | "on-surface";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "secondary"
        ? "text-secondary"
        : tone === "tertiary"
          ? "text-tertiary"
          : "text-on-surface";
  return (
    <View className="flex-1 bg-surface-container p-md rounded-xl border border-outline-variant">
      <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant mb-1">
        {label}
      </Text>
      <Text className={`text-title-md font-semibold ${toneClass}`}>{value}</Text>
    </View>
  );
}

function ExerciseCard({
  index,
  item,
  onDelete,
}: {
  index: number;
  item: WorkoutExercise;
  onDelete: (item: WorkoutExercise) => void;
}) {
  const isTime = item.exercise.type === "time";
  return (
    <View className="flex-row items-stretch bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
      {/* Número grande lateral */}
      <View className="w-12 items-center justify-center bg-surface-lowest border-r border-outline-variant">
        <Text className="text-display-md italic text-outline-variant/40">
          {String(index + 1).padStart(2, "0")}
        </Text>
      </View>

      {/* Conteúdo */}
      <View className="flex-1 p-md">
        <View className="flex-row justify-between items-start mb-1">
          <Text className="flex-1 text-title-md text-on-surface uppercase font-semibold pr-2">
            {item.exercise.name}
          </Text>
          <View
            className={`px-2 py-0.5 rounded border ${
              isTime
                ? "bg-secondary/10 border-secondary/20"
                : "bg-tertiary/10 border-tertiary/20"
            }`}
          >
            <Text
              className={`text-label-sm uppercase ${
                isTime ? "text-secondary" : "text-tertiary"
              }`}
            >
              {isTime ? "Tempo" : "Força"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4 mb-sm">
          <View className="flex-row items-center gap-1">
            <Text className="text-primary text-sm">⟳</Text>
            <Text className="text-label-md text-on-surface">
              {repsLabel(item)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-primary text-sm">◷</Text>
            <Text className="text-label-md text-on-surface">
              {item.exercise.unit}
            </Text>
          </View>
        </View>

        {item.note ? (
          <Text className="text-body-md text-on-surface-variant italic border-l-2 border-outline-variant pl-3">
            {item.note}
          </Text>
        ) : null}
      </View>

      {/* Excluir exercício */}
      <Pressable
        onPress={() => onDelete(item)}
        hitSlop={8}
        className="w-11 items-center justify-center border-l border-outline-variant active:bg-error/10"
      >
        <View className="w-8 h-8 items-center justify-center rounded-full bg-error/15">
          <Text className="text-error text-base font-bold">✕</Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const removeWorkout = useWorkoutsStore((s) => s.remove);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await workoutsService.get(id);
      setWorkout(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleDeleteWorkout = useCallback(() => {
    if (!id) return;
    Alert.alert(
      "Excluir treino",
      `Tem certeza que deseja excluir "${workout?.name ?? "este treino"}"? Os exercícios e o histórico de sessões serão removidos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await removeWorkout(id);
              router.back();
            } catch {
              Alert.alert("Erro", "Não foi possível excluir o treino.");
            }
          },
        },
      ]
    );
  }, [id, workout?.name, removeWorkout]);

  const handleDeleteExercise = useCallback(
    (ex: WorkoutExercise) => {
      if (!id) return;
      Alert.alert(
        "Remover exercício",
        `Remover "${ex.exercise.name}" deste treino?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Remover",
            style: "destructive",
            onPress: async () => {
              try {
                await workoutsService.removeExercise(id, ex.id);
                await load();
              } catch {
                Alert.alert("Erro", "Não foi possível remover o exercício.");
              }
            },
          },
        ]
      );
    },
    [id, load]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const today = DAY_INDEX[new Date().getDay()];
  const exercises = workout?.exercises ?? [];
  const totalSets = exercises.reduce((sum, e) => sum + (e.sets ?? 0), 0);
  const estMinutes = totalSets * 3; // estimativa: ~3 min por série

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Top App Bar (glass) */}
      <View className="flex-row justify-between items-center px-md h-16 border-b border-outline-variant">
        <View className="flex-row items-center gap-3 flex-1">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full active:opacity-60"
          >
            <Text className="text-on-surface text-2xl">‹</Text>
          </Pressable>
          <Text
            className="flex-1 text-title-md text-primary italic uppercase font-bold"
            numberOfLines={1}
          >
            {workout?.name ?? "Treino"}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleDeleteWorkout}
            hitSlop={8}
            className="w-9 h-9 items-center justify-center rounded-full bg-error/15 active:bg-error/30"
          >
            <Text className="text-error text-base font-bold">✕</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/workout/${id}/session`)}
            className="bg-primary px-5 py-2 rounded-lg active:opacity-80"
            style={{
              shadowColor: "#d0bcff",
              shadowOpacity: 0.3,
              shadowRadius: 15,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Text className="text-on-primary text-label-md uppercase tracking-wider font-semibold">
              Iniciar
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#d0bcff" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-lg gap-md">
          <EmptyState
            icon="⚠️"
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
          />
          <Pressable
            onPress={load}
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
          {/* Descrição + dias */}
          {workout?.description ? (
            <Text className="text-body-md text-on-surface-variant">
              {workout.description}
            </Text>
          ) : null}

          <View className="flex-row flex-wrap gap-1.5">
            {workout?.days_of_week.map((day) => {
              const isToday = day === today;
              return (
                <View
                  key={day}
                  className={`rounded-full px-3 py-1 border ${
                    isToday
                      ? "bg-primary/15 border-primary"
                      : "bg-transparent border-outline-variant"
                  }`}
                >
                  <Text
                    className={`text-label-sm uppercase tracking-widest ${
                      isToday ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Grid de stats */}
          <View className="flex-row gap-md">
            <StatCard
              label="Exercícios"
              value={String(exercises.length)}
              tone="secondary"
            />
            <StatCard
              label="Volume"
              value={`${totalSets} séries`}
              tone="primary"
            />
          </View>
          <View className="flex-row gap-md">
            <StatCard
              label="Duração est."
              value={estMinutes > 0 ? `~${estMinutes} min` : "—"}
              tone="tertiary"
            />
            <StatCard
              label="Status"
              value={workout?.active ? "Ativo" : "Inativo"}
              tone="on-surface"
            />
          </View>

          {/* Lista de exercícios */}
          {exercises.length === 0 ? (
            <View className="mt-md">
              <EmptyState
                icon="🏋️"
                title="Nenhum exercício ainda"
                description="Adicione exercícios para montar este treino."
              />
            </View>
          ) : (
            <View className="gap-md mt-sm">
              {exercises
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((ex, i) => (
                  <ExerciseCard
                    key={ex.id}
                    index={i}
                    item={ex}
                    onDelete={handleDeleteExercise}
                  />
                ))}
            </View>
          )}

          {/* Adicionar exercício (borda tracejada) */}
          <Pressable
            onPress={() => router.push(`/workout/${id}/add-exercise`)}
            className="mt-md border-2 border-dashed border-outline-variant p-lg rounded-xl items-center justify-center gap-2 active:opacity-70"
          >
            <Text className="text-3xl text-on-surface-variant">＋</Text>
            <Text className="text-label-md uppercase tracking-widest text-on-surface-variant">
              Adicionar Exercício
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}