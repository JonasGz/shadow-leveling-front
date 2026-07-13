import { useEffect, useState } from "react";
import { View, Text, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Button } from "../../src/components/ui/Button";
import { useToast } from "../../src/components/ui/Toast";
import { authService } from "../../src/services/auth.service";
import { finishAuth } from "../../src/lib/finishAuth";

GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

type Provider = "google" | "apple";

export default function AuthScreen() {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  async function handleGoogle() {
    setBusy("google");
    try {
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      // google-signin returns { data: { idToken } } on recent versions.
      const idToken = (result as any)?.data?.idToken ?? (result as any)?.idToken;
      if (!idToken) throw new Error("no id token");
      await authService.socialLogin("google", idToken);
      await finishAuth();
    } catch (err: any) {
      // Silent when the user simply cancels the native sheet.
      if (err?.code !== "SIGN_IN_CANCELLED" && err?.code !== "-5") {
        showToast("Não foi possível entrar com o Google.", "error");
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleApple() {
    setBusy("apple");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error("no identity token");
      await authService.socialLogin("apple", credential.identityToken);
      await finishAuth();
    } catch (err: any) {
      if (err?.code !== "ERR_REQUEST_CANCELED") {
        showToast("Não foi possível entrar com a Apple.", "error");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-lg justify-center">
      <View className="items-center mb-xl">
        <Text className="text-display-md text-primary font-black tracking-tight">SHADOW</Text>
        <Text className="text-display-md text-on-surface font-black tracking-tight -mt-2">LEVELING</Text>
        <Text className="text-label-md text-on-surface-variant mt-2 tracking-widest">
          ENTRE PARA EVOLUIR
        </Text>
      </View>

      <View className="gap-md">
        <Button
          testID="auth-google"
          label="Continuar com Google"
          onPress={handleGoogle}
          loading={busy === "google"}
          disabled={busy !== null}
          fullWidth
        />

        {appleAvailable && (
          <Button
            testID="auth-apple"
            label="Continuar com Apple"
            variant="tonal"
            onPress={handleApple}
            loading={busy === "apple"}
            disabled={busy !== null}
            fullWidth
          />
        )}

        <Button
          testID="auth-email"
          label="Continuar com e-mail"
          variant="ghost"
          onPress={() => router.push("/(auth)/email")}
          disabled={busy !== null}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
