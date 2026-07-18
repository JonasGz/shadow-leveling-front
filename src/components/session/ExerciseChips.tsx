import { View, Text, Pressable, ScrollView } from "react-native";
import Check from "lucide-react-native/icons/check";
import type { LocalSet } from "./SetRow";
import type { Exercise, WorkoutExercise } from "../../types/api.types";

interface ExerciseChipsProps {
  exercises: WorkoutExercise[];
  currentIndex: number;
  setsByExercise: Record<string, LocalSet[]>;
  swapByWorkoutExercise: Record<string, Exercise>;
  onSelect: (index: number) => void;
}

/** Atalhos para pular direto a qualquer exercício da sessão. */
export function ExerciseChips({
  exercises,
  currentIndex,
  setsByExercise,
  swapByWorkoutExercise,
  onSelect,
}: ExerciseChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerClassName="px-md pb-8 gap-2 py-3"
      keyboardShouldPersistTaps="handled"
    >
      {exercises.map((we, i) => {
        const name = (swapByWorkoutExercise[we.id] ?? we.exercise).name;
        const active = i === currentIndex;
        const sets = setsByExercise[we.id] ?? [];
        const allDone = sets.length > 0 && sets.every((s) => s.done);
        return (
          <Pressable
            key={we.id}
            onPress={() => onSelect(i)}
            className={`w-36 h-24 px-3 py-3 rounded-xl border justify-between active:opacity-70 ${
              allDone
                ? "bg-secondary/15 border-secondary/60"
                : active
                  ? "bg-primary/20 border-primary/60"
                  : "bg-surface-low border-[#FFFFFF29]"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-xs font-bold ${
                  active ? "text-secondary" : "text-outline"
                }`}
              >
                {i + 1}
              </Text>
              {allDone && (
                <View className="w-5 h-5 rounded-full bg-secondary/25 items-center justify-center">
                  <Check size={13} color="#B26CFF" strokeWidth={3} />
                </View>
              )}
            </View>
            <Text
              className={`text-label-md font-semibold ${
                active ? "text-on-surface" : "text-on-surface-variant"
              }`}
              numberOfLines={3}
            >
              {name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
