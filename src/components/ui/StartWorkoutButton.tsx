import { router } from "expo-router";
import { Play, Check } from "lucide-react-native";
import { Button } from "./Button";

export function StartWorkoutButton({
  workoutId,
  done = false,
}: {
  workoutId: string;
  done?: boolean;
}) {
  if (done) {
    return <Button label="Concluído" icon={Check} variant="tonal" fullWidth disabled />;
  }

  return (
    <Button
      label="Iniciar treino"
      icon={Play}
      fullWidth
      style={{ boxShadow: "0px 6px 18px rgba(159, 31, 255, 0.4)" }}
      onPress={(e) => {
        e.stopPropagation();
        router.push(`/workout/${workoutId}/session`);
      }}
    />
  );
}
