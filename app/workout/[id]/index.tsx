import { useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import Play from "lucide-react-native/icons/play";
import Plus from "lucide-react-native/icons/plus";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { IconButton } from "../../../src/components/ui/IconButton";
import { workoutsService } from "../../../src/services/workouts.service";
import { DAY_UPPER } from "../../../src/lib/date";
import type { WorkoutExercise } from "../../../src/types/api.types";
import { useScreenData } from "../../../src/hooks/useScreenData";

function repsLabel(ex: WorkoutExercise): string {
  if (ex.exercise.type === "time") {
    return ex.duration
      ? `${ex.sets} séries · ${ex.duration}s`
      : `${ex.sets} séries`;
  }
  if (ex.reps_min != null && ex.reps_max != null) {
    return ex.reps_min === ex.reps_max
      ? `${ex.sets} séries · ${ex.reps_min} reps`
      : `${ex.sets} séries · ${ex.reps_min}–${ex.reps_max} reps`;
  }
  if (ex.reps_min != null) return `${ex.sets} séries · ${ex.reps_min} reps`;
  return `${ex.sets} séries`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-surface-low border border-card-border rounded-xl p-md items-center">
      <Text className="text-title-xl text-on-surface font-extrabold">
        {value}
      </Text>
      <Text className="text-label-md text-on-surface-variant mt-1.5">
        {label}
      </Text>
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
  return (
    <View className="bg-surface-low border border-card-border rounded-xl px-md py-md flex-row items-center gap-3">
      <View className="w-10 h-10 rounded-[9px] bg-surface-highest items-center justify-center">
        <Text className="text-label-md text-outline font-bold">
          {index + 1}
        </Text>
      </View>

      <View className="flex-1 items-center">
        <Text
          className="text-title-md text-[#ECECEE] font-semibold"
          numberOfLines={1}
        >
          {item.exercise.name}
        </Text>
        <Text className="text-body-sm font-light text-outline mt-0.5">
          {repsLabel(item)}
        </Text>
      </View>

      <Pressable
        onPress={() => onDelete(item)}
        hitSlop={8}
        className="w-8 h-8 items-center justify-center rounded-full bg-error/15 active:bg-error/30"
      >
        <Text className="text-error text-base font-bold">✕</Text>
      </Pressable>
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: workout,
    loading,
    error,
    reload,
  } = useScreenData(async () => (id ? workoutsService.get(id) : null), [id]);

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
                await reload();
              } catch {
                Alert.alert("Erro", "Não foi possível remover o exercício.");
              }
            },
          },
        ],
      );
    },
    [id, reload],
  );

  const exercises = workout?.exercises ?? [];
  const totalSets = exercises.reduce((sum, e) => sum + (e.sets ?? 0), 0);
  const estMinutes = totalSets * 3; // estimativa: ~3 min por série
  const daysLabel = (workout?.days_of_week ?? [])
    .map((d) => DAY_UPPER[d])
    .join(" · ");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Top App Bar */}
      <View className="flex-row justify-between items-center px-md h-16">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="active:opacity-60"
        >
          <ChevronLeft size={22} color="#DCDCDD" />
        </Pressable>
        <Text className="text-title-lg text-white font-bold">Treino</Text>
        <IconButton
          icon={Play}
          variant="primary"
          onPress={() => router.push(`/workout/${id}/session`)}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c8a3ff" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-lg gap-md">
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
            action={{ label: "Tentar novamente", onPress: reload }}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-md py-md gap-md pb-xl"
          showsVerticalScrollIndicator={false}
        >
          {/* Status + dias */}
          <View className="flex-row items-center gap-2">
            <View
              className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${
                workout?.active ? "bg-success/15" : "bg-surface-variant"
              }`}
            >
              <View
                className={`w-2 h-2 rounded-full ${
                  workout?.active ? "bg-success" : "bg-outline"
                }`}
              />
              <Text
                className={`text-label-sm font-bold ${
                  workout?.active ? "text-[#4ADE80]" : "text-on-surface-variant"
                }`}
              >
                {workout?.active ? "Ativo" : "Inativo"}
              </Text>
            </View>
            {daysLabel ? (
              <Text className="text-label-sm uppercase tracking-widest text-secondary">
                {daysLabel}
              </Text>
            ) : null}
          </View>

          {/* Título + descrição */}
          <View className="gap-1">
            <Text className="text-title-xl text-center text-white font-bold">
              {workout?.name ?? "Treino"}
            </Text>
            {workout?.description ? (
              <Text className="text-body-sm text-on-surface-variant">
                {workout.description}
              </Text>
            ) : null}
          </View>

          {/* Stats */}
          <View className="flex-row gap-md">
            <StatCard label="Exercícios" value={String(exercises.length)} />
            <StatCard label="Séries" value={String(totalSets)} />
            <StatCard
              label="Min est."
              value={estMinutes > 0 ? `~${estMinutes}` : "—"}
            />
          </View>

          {/* Lista de exercícios */}
          {exercises.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="Nenhum exercício ainda"
              description="Adicione o primeiro exercício para montar este treino."
              action={{
                label: "Adicionar exercício",
                onPress: () => router.push(`/workout/${id}/add-exercise`),
              }}
            />
          ) : (
            <>
              <Text className="text-title-md text-center text-white font-bold mt-sm">
                Exercícios
              </Text>
              <View className="gap-sm">
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

              <View className="items-center gap-sm mt-sm">
                <IconButton
                  icon={Plus}
                  onPress={() => router.push(`/workout/${id}/add-exercise`)}
                />
                <Text className="text-label-md text-on-surface-variant">
                  Adicionar exercício
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
