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
import { useLocalSearchParams, router } from "expo-router";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import Play from "lucide-react-native/icons/play";
import Plus from "lucide-react-native/icons/plus";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import Pencil from "lucide-react-native/icons/pencil";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { IconButton } from "../../../src/components/ui/IconButton";
import { workoutsService } from "../../../src/services/workouts.service";
import { DAY_UPPER } from "../../../src/lib/date";
import type { WorkoutExercise } from "../../../src/types/api.types";
import { useScreenData } from "../../../src/hooks/useScreenData";
import { color } from "../../../src/theme/palette";
import { cn } from "../../../src/lib/cn";
import { Card } from "../../../src/components/ui/Card";
import { EditExerciseModal } from "../../../src/components/EditExerciseModal";

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
    <Card className="flex-1 items-center">
      <Text className="text-3xl font-bold text-white">{value}</Text>
      <Text className="mt-2 text-sm font-normal text-gray-200">{label}</Text>
    </Card>
  );
}

function ExerciseCard({
  index,
  item,
  onEdit,
  onDelete,
}: {
  index: number;
  item: WorkoutExercise;
  onEdit: (item: WorkoutExercise) => void;
  onDelete: (item: WorkoutExercise) => void;
}) {
  return (
    <Card className="flex-row items-center gap-3" onPress={() => onEdit(item)}>
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-gray-500">
        <Text className="text-base font-bold text-gray-400">{index + 1}</Text>
      </View>

      <View className="flex-1 items-center">
        <Text className="text-xl font-semibold text-gray-50" numberOfLines={1}>
          {item.exercise.name}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Text className="text-sm font-light text-gray-400">
            {repsLabel(item)}
          </Text>
          <Pencil size={12} color={color["gray-400"]} />
        </View>
      </View>

      <Pressable
        onPress={() => onDelete(item)}
        hitSlop={8}
        className="h-8 w-8 items-center justify-center rounded-full bg-error/15 active:bg-error/30"
      >
        <Text className="text-base font-bold text-error">✕</Text>
      </Pressable>
    </Card>
  );
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [editing, setEditing] = useState<WorkoutExercise | null>(null);
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
  const estMinutes = totalSets * 3;
  const daysLabel = (workout?.days_of_week ?? [])
    .map((d) => DAY_UPPER[d])
    .join(" · ");

  return (
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      <View className="h-16 flex-row items-center justify-between px-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="active:opacity-60"
        >
          <ChevronLeft size={22} color={color["gray-50"]} />
        </Pressable>
        <Text className="text-2xl font-bold text-white">Treino</Text>
        <IconButton
          icon={Play}
          variant="primary"
          onPress={() => router.push(`/workout/${id}/session`)}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={color["purple-100"]} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
            action={{ label: "Tentar novamente", onPress: reload }}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-4 py-4 gap-4 pb-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                "flex-row items-center gap-2 rounded-full px-3 py-1",
                workout?.active ? "bg-success/15" : "",
              )}
            >
              <View
                className={cn(
                  "h-2 w-2 rounded-full",
                  workout?.active ? "bg-success" : "bg-gray-400",
                )}
              />
              <Text
                className={cn(
                  "text-xs font-bold",
                  workout?.active ? "text-success" : "text-gray-200",
                )}
              >
                {workout?.active ? "Ativo" : "Inativo"}
              </Text>
            </View>
            {daysLabel ? (
              <Text className="text-xs font-medium uppercase text-purple-200">
                {daysLabel}
              </Text>
            ) : null}
          </View>

          <View className="gap-1">
            <Text className="text-center text-3xl font-bold text-white">
              {workout?.name ?? "Treino"}
            </Text>
            {workout?.description ? (
              <Text className="text-sm font-normal text-gray-200">
                {workout.description}
              </Text>
            ) : null}
          </View>

          <View className="flex-row gap-4">
            <StatCard label="Exercícios" value={String(exercises.length)} />
            <StatCard label="Séries" value={String(totalSets)} />
            <StatCard
              label="Min est."
              value={estMinutes > 0 ? `~${estMinutes}` : "—"}
            />
          </View>

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
              <Text className="mt-2 text-center text-xl font-bold text-white">
                Exercícios
              </Text>
              <View className="gap-2">
                {exercises
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((ex, i) => (
                    <ExerciseCard
                      key={ex.id}
                      index={i}
                      item={ex}
                      onEdit={setEditing}
                      onDelete={handleDeleteExercise}
                    />
                  ))}
              </View>

              <View className="mt-2 items-center gap-2">
                <IconButton
                  icon={Plus}
                  onPress={() => router.push(`/workout/${id}/add-exercise`)}
                />
                <Text className="text-base font-semibold text-gray-200">
                  Adicionar exercício
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {id ? (
        <EditExerciseModal
          item={editing}
          workoutId={id}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      ) : null}
    </SafeAreaView>
  );
}
