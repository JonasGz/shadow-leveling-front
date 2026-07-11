import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ToastProvider } from "../src/components/ui/Toast";
import { authService } from "../src/services/auth.service";
import { useAuthStore } from "../src/stores/auth.store";
import { router } from "expo-router";
import { registerForPush, addNotificationResponseListener } from "../src/lib/push";

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    async function bootstrap() {
      const token = await authService.getStoredToken();
      if (!token) {
        router.replace("/(auth)");
        return;
      }
      try {
        const user = await authService.me();
        setUser(user);
        router.replace("/(tabs)/");
        // Register for push once authenticated (best-effort, never blocks login).
        registerForPush();
      } catch {
        router.replace("/(auth)/login");
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    const sub = addNotificationResponseListener();
    return () => sub.remove();
  }, []);

  return (
    <ToastProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#131314" } }} />
    </ToastProvider>
  );
}
