import { router } from "expo-router";
import Play from "lucide-react-native/icons/play";
import Check from "lucide-react-native/icons/check";
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
      style={{ boxShadow: "0px 6px 18px rgba(129, 19, 211, 0.4)" }}
      onPress={(e) => {
        e.stopPropagation();
        router.push(`/workout/${workoutId}/session`);
      }}
    />
  );
}
