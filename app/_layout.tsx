import "../global.css";
import { useEffect } from "react";
import { LogBox } from "react-native";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

LogBox.ignoreLogs(["Sending `onAnimatedValueUpdate`"]);
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import { ToastProvider } from "../src/components/ui/Toast";
import { authService } from "../src/services/auth.service";
import { useAuthStore } from "../src/stores/auth.store";
import { router } from "expo-router";
import {
  registerForPush,
  addNotificationResponseListener,
} from "../src/lib/push";
import { installPoppins } from "../src/lib/fonts";
import { parseInviteCode, setPendingInvite } from "../src/lib/invite";
import { color } from "../src/theme/palette";

installPoppins();

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    async function bootstrap() {
      const inviteCode = parseInviteCode(await Linking.getInitialURL());

      const token = await authService.getStoredToken();
      if (!token) {
        if (inviteCode) await setPendingInvite(inviteCode);
        router.replace("/(auth)/welcome");
        return;
      }
      try {
        const user = await authService.me();
        setUser(user);
        router.replace(inviteCode ? `/join/${inviteCode}` : "/(tabs)/");
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
          contentStyle: { backgroundColor: color["gray-700"] },
        }}
      />
    </ToastProvider>
  );
}
