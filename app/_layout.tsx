import "../global.css";
import { useEffect } from "react";
import { LogBox } from "react-native";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

// Benign RN/reanimated warning fired during screen transitions — not a real bug.
LogBox.ignoreLogs(["Sending `onAnimatedValueUpdate`"]);
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
import { parseInviteCode, setPendingInvite } from "../src/lib/invite";
import { color } from "../src/theme/palette";

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
      // Cold-start invite deep-link (shadowleveling://join/<CODE>): the redirects
      // below would otherwise clobber it, so capture the code first.
      const inviteCode = parseInviteCode(await Linking.getInitialURL());

      const token = await authService.getStoredToken();
      if (!token) {
        if (inviteCode) await setPendingInvite(inviteCode); // resumed after login
        router.replace("/(auth)/welcome");
        return;
      }
      try {
        const user = await authService.me();
        setUser(user);
        router.replace(inviteCode ? `/join/${inviteCode}` : "/(tabs)/");
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
          contentStyle: { backgroundColor: color["gray-700"] },
        }}
      />
    </ToastProvider>
  );
}
