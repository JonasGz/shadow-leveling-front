import { View, Text, Pressable, ScrollView } from "react-native";
import Check from "lucide-react-native/icons/check";
import type { LocalSet } from "./SetRow";
import type { Exercise, WorkoutExercise } from "../../types/api.types";
import { color } from "../../theme/palette";
import { cn } from "../../lib/cn";

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
      className="grow-0"
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
            className={cn(
              "h-24 w-36 justify-between rounded-lg border px-3 py-3 active:opacity-70",
              allDone
                ? "border-purple-200/60 bg-purple-200/15"
                : active
                  ? "border-purple-300/60 bg-purple-300/20"
                  : "border-white/12 bg-gray-600",
            )}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className={cn(
                  "text-xs font-bold",
                  active ? "text-purple-200" : "text-gray-400",
                )}
              >
                {i + 1}
              </Text>
              {allDone && (
                <View className="h-5 w-5 items-center justify-center rounded-full bg-purple-200/25">
                  <Check
                    size={13}
                    color={color["purple-200"]}
                    strokeWidth={3}
                  />
                </View>
              )}
            </View>
            <Text
              className={cn(
                "text-label-md font-semibold",
                active ? "text-white" : "text-gray-200",
              )}
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
