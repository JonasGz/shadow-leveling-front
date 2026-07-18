import { useEffect, useState } from "react";
import { View, Text, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Apple from "lucide-react-native/icons/apple";
import type { LucideIcon } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { Button } from "../../src/components/ui/Button";
import { useToast } from "../../src/components/ui/Toast";
import { authService } from "../../src/services/auth.service";
import { finishAuth } from "../../src/lib/finishAuth";
// Aliasado: GoogleGlyph tem uma prop chamada `color`.
import { color as palette } from "../../src/theme/palette";

// Monochrome Google glyph from the mockup — lucide has no Google brand icon.
function GoogleGlyph({
  size = 20,
  color = palette.white,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 6.32 2.26" />
      <Path d="M22 12h-9" />
    </Svg>
  );
}

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
      const idToken =
        (result as any)?.data?.idToken ?? (result as any)?.idToken;
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
    <SafeAreaView className="flex-1 justify-center bg-gray-700 px-lg">
      <View className="items-center">
        <Text className="text-display-xxl font-extrabold text-purple-300">
          SHADOW
        </Text>
        <Text className="-mt-2 text-display-xxl font-extrabold text-white">
          LEVELING
        </Text>
        <Text
          className="mt-4 text-label-md font-semibold uppercase text-gray-200"
          style={{ letterSpacing: 2 }}
        >
          Entre para evoluir
        </Text>
      </View>

      <View className="mt-10">
        <View className="gap-3">
          <Button
            label="Continuar com Google"
            transform="capitalize"
            labelClassName="text-body-lg"
            // ponytail: custom SVG isn't a LucideIcon; Button only calls it with size/color.
            icon={GoogleGlyph as unknown as LucideIcon}
            style={{
              shadowColor: palette["purple-300"],
              shadowOpacity: 0.4,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
            onPress={handleGoogle}
            loading={busy === "google"}
            disabled={busy !== null}
            fullWidth
          />

          {appleAvailable && (
            <Button
              label="Continuar com Apple"
              variant="tonal"
              transform="capitalize"
              labelClassName="text-body-lg"
              icon={Apple}
              className="border border-purple-300/35"
              onPress={handleApple}
              loading={busy === "apple"}
              disabled={busy !== null}
              fullWidth
            />
          )}
        </View>

        <Button
          label="Continuar com e-mail"
          variant="ghost"
          transform="capitalize"
          labelClassName="text-body-lg"
          onPress={() => router.push("/(auth)/email")}
          disabled={busy !== null}
          fullWidth
          className="mt-6"
        />
      </View>
    </SafeAreaView>
  );
}
