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
            className={`h-24 w-36 justify-between rounded-xl border px-3 py-3 active:opacity-70 ${
              allDone
                ? "border-secondary/60 bg-secondary/15"
                : active
                  ? "border-primary/60 bg-primary/20"
                  : "border-[#FFFFFF29] bg-surface-low"
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
                <View className="h-5 w-5 items-center justify-center rounded-full bg-secondary/25">
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
