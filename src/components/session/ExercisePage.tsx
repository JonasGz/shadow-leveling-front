import { memo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";
import TrendingUp from "lucide-react-native/icons/trending-up";
import { SetRow, type LocalSet, type SetField } from "./SetRow";
import type { Hint } from "../../features/progression";
import type { Exercise, WorkoutExercise } from "../../types/api.types";

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
      contentContainerClassName="px-md py-sm pb-6"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="bg-surface-low border border-card-border rounded-2xl overflow-hidden">
        <View className="p-lg bg-primary/20">
          {swapped && (
            <View className="flex-row items-center gap-1.5 mb-2 bg-secondary/20 border border-secondary/40 rounded-full px-2.5 py-1 self-start">
              <RotateCcw size={11} color="#B26CFF" />
              <Text className="text-label-sm text-secondary uppercase tracking-widest font-bold">
                Substituído p/ hoje
              </Text>
            </View>
          )}
          <Text
            className="text-title-xl text-white font-extrabold"
            numberOfLines={2}
          >
            {effective.name}
          </Text>
          {swapped && (
            <Text className="text-label-sm text-white/50 mt-1 line-through">
              {we.exercise.name}
            </Text>
          )}
          <View className="flex-row items-center gap-2 mt-2.5 flex-wrap">
            <View className="bg-black/30 px-2.5 py-1 rounded-full">
              <Text className="text-[#E5D6FF] text-label-sm uppercase tracking-widest font-bold">
                {timed ? "Tempo" : "Força"}
              </Text>
            </View>
            <Text className="text-on-surface-variant text-label-sm font-semibold">
              {we.sets} séries
              {repsRangeLabel(we, timed)}
            </Text>
            <Pressable
              onPress={onRequestSwap}
              className="bg-surface-lowest/60 border border-[#FFFFFF29] px-2.5 py-1 rounded-full active:opacity-70"
            >
              <Text className="text-white/90 text-label-sm uppercase tracking-widest font-bold">
                Trocar (máquina ocupada)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Dica de progressão (Diferencial 2): meta discreta no topo do
            exercício, baseada na última sessão. */}
        {hint && (
          <View className="flex-row items-center gap-2 px-lg pt-3 pb-1">
            <TrendingUp size={15} color="#5CE1E6" />
            <Text className="flex-1 text-label-md text-info font-semibold">
              {hint.text}
            </Text>
          </View>
        )}

        <View className="p-3.5">
          <View className="flex-row items-center gap-2 px-2 pb-3">
            <Text className="w-10 text-center text-label-sm uppercase tracking-widest text-outline-variant">
              Série
            </Text>
            <Text className="flex-1 text-center text-label-sm uppercase tracking-widest text-outline-variant">
              {timed ? "Duração (s)" : "Peso (kg)"}
            </Text>
            {!timed && (
              <Text className="flex-1 text-center text-label-sm uppercase tracking-widest text-outline-variant">
                Reps
              </Text>
            )}
            <Text className="w-9 text-center text-label-sm uppercase tracking-widest text-outline-variant">
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
      </View>
    </ScrollView>
  );
});
