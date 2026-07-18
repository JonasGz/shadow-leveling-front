import { Stack } from "expo-router";
import { color } from "../../src/theme/palette";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color["gray-700"] },
        animation: "fade",
      }}
    />
  );
}
