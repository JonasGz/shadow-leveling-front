import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ToastProvider } from "../src/components/ui/Toast";
import { authService } from "../src/services/auth.service";
import { useAuthStore } from "../src/stores/auth.store";
import { router } from "expo-router";

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    async function bootstrap() {
      const token = await authService.getStoredToken();
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }
      try {
        const user = await authService.me();
        setUser(user);
        router.replace("/(tabs)/");
      } catch {
        router.replace("/(auth)/login");
      }
    }
    bootstrap();
  }, []);

  return (
    <ToastProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#131314" } }} />
    </ToastProvider>
  );
}
