import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  OpenSans_300Light,
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
  OpenSans_800ExtraBold,
} from "@expo-google-fonts/open-sans";
import { ToastProvider } from "../src/components/ui/Toast";
import { authService } from "../src/services/auth.service";
import { useAuthStore } from "../src/stores/auth.store";
import { router } from "expo-router";
import {
  registerForPush,
  addNotificationResponseListener,
} from "../src/lib/push";
import { installOpenSans } from "../src/lib/fonts";

installOpenSans();

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);
  const [fontsLoaded] = useFonts({
    OpenSans_300Light,
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
    OpenSans_800ExtraBold,
  });

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

  if (!fontsLoaded) return null;

  return (
    <ToastProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
        }}
      />
    </ToastProvider>
  );
}
