import { memo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";
import TrendingUp from "lucide-react-native/icons/trending-up";
import { SetRow, type LocalSet, type SetField } from "./SetRow";
import type { Hint } from "../../features/progression";
import type { Exercise, WorkoutExercise } from "../../types/api.types";
import { color } from "../../theme/palette";
import { Card } from "../ui/Card";

interface ExercisePageProps {
  workoutExercise: WorkoutExercise;
  /** Substituto escolhido para esta sessão, se houver (Máquina Ocupada). */
  swapped: Exercise | null;
  sets: LocalSet[];
  hint: Hint;
  pageWidth: number;
  onChangeField: (
    workoutExerciseId: string,
    index: number,
    field: SetField,
    value: string,
  ) => void;
  onToggleDone: (we: WorkoutExercise, index: number) => void;
  onRequestSwap: () => void;
}

function repsRangeLabel(we: WorkoutExercise, timed: boolean): string {
  if (timed) return we.duration ? ` × ${we.duration}s` : "";
  if (we.reps_min == null) return "";
  const max =
    we.reps_max && we.reps_max !== we.reps_min ? `–${we.reps_max}` : "";
  return ` × ${we.reps_min}${max} reps`;
}

/**
 * Uma página do pager: card do exercício + grid de séries.
 *
 * Memoizado porque o pager mantém várias páginas montadas — sem isso, digitar
 * em uma série re-renderiza todas as páginas vizinhas.
 */
export const ExercisePage = memo(function ExercisePage({
  workoutExercise: we,
  swapped,
  sets,
  hint,
  pageWidth,
  onChangeField,
  onToggleDone,
  onRequestSwap,
}: ExercisePageProps) {
  const effective = swapped ?? we.exercise;
  const timed = effective.type === "time";
  const firstPendingIdx = sets.findIndex((s) => !s.done);

  return (
    <ScrollView
      style={{ width: pageWidth }}
      contentContainerClassName="px-4 py-2 pb-6"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Card className="overflow-hidden p-0">
        <View className="bg-purple-300/20 p-6">
          {swapped && (
            <View className="mb-2 flex-row items-center gap-2 self-start rounded-full border border-purple-200/40 bg-purple-200/20 px-3 py-1">
              <RotateCcw size={11} color={color["purple-200"]} />
              <Text className="text-label-sm font-bold uppercase tracking-widest text-purple-200">
                Substituído p/ hoje
              </Text>
            </View>
          )}
          <Text
            className="text-title-xl font-extrabold text-white"
            numberOfLines={2}
          >
            {effective.name}
          </Text>
          {swapped && (
            <Text className="mt-1 text-label-sm text-white/50 line-through">
              {we.exercise.name}
            </Text>
          )}
          <View className="mt-3 flex-row flex-wrap items-center gap-2">
            <View className="rounded-full bg-black/30 px-3 py-1">
              <Text className="text-label-sm font-bold uppercase tracking-widest text-purple-50">
                {timed ? "Tempo" : "Força"}
              </Text>
            </View>
            <Text className="text-label-sm font-semibold text-gray-200">
              {we.sets} séries
              {repsRangeLabel(we, timed)}
            </Text>
            <Pressable
              onPress={onRequestSwap}
              className="rounded-full border border-white/12 bg-gray-700/60 px-3 py-1 active:opacity-70"
            >
              <Text className="text-label-sm font-bold uppercase tracking-widest text-white/90">
                Trocar (máquina ocupada)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Dica de progressão (Diferencial 2): meta discreta no topo do
            exercício, baseada na última sessão. */}
        {hint && (
          <View className="flex-row items-center gap-2 px-6 pb-1 pt-3">
            <TrendingUp size={15} color="#5CE1E6" />
            <Text className="flex-1 text-label-md font-semibold text-info">
              {hint.text}
            </Text>
          </View>
        )}

        <View className="p-4">
          <View className="flex-row items-center gap-2 px-2 pb-3">
            <Text className="w-10 text-center text-label-sm uppercase tracking-widest text-gray-300">
              Série
            </Text>
            <Text className="flex-1 text-center text-label-sm uppercase tracking-widest text-gray-300">
              {timed ? "Duração (s)" : "Peso (kg)"}
            </Text>
            {!timed && (
              <Text className="flex-1 text-center text-label-sm uppercase tracking-widest text-gray-300">
                Reps
              </Text>
            )}
            <Text className="w-9 text-center text-label-sm uppercase tracking-widest text-gray-300">
              ✓
            </Text>
          </View>

          {sets.map((set, idx) => (
            <SetRow
              key={idx}
              index={idx}
              set={set}
              timed={timed}
              isActiveRow={!set.done && firstPendingIdx === idx}
              onChangeField={(index, field, value) =>
                onChangeField(we.id, index, field, value)
              }
              onToggleDone={(index) => onToggleDone(we, index)}
            />
          ))}
        </View>
      </Card>
    </ScrollView>
  );
});
