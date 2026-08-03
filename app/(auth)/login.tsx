import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Mail from "lucide-react-native/icons/mail";
import Svg, { Path } from "react-native-svg";
import { useToast } from "../../src/components/ui/Toast";
import { authService } from "../../src/services/auth.service";
import { finishAuth } from "../../src/lib/finishAuth";
import { cn } from "../../src/lib/cn";
import { color as palette } from "../../src/theme/palette";

function GoogleGlyph({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 51 51" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.3768 25.7446C48.3768 24.0324 48.2231 22.386 47.9378 20.8055H25.1963V30.1458H38.1914C37.6317 33.1641 35.9304 35.7214 33.3731 37.4336V43.4922H41.1768C45.7426 39.2885 48.3768 33.0982 48.3768 25.7446Z"
        fill="#4285F4"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25.196 49.3418C31.7155 49.3418 37.1814 47.1796 41.1765 43.4918L33.3728 37.4333C31.2106 38.8821 28.4448 39.7382 25.196 39.7382C18.907 39.7382 13.5838 35.4906 11.685 29.7833H3.61792V36.0394C7.59109 43.9308 15.757 49.3418 25.196 49.3418Z"
        fill="#34A853"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.6853 29.7839C11.2024 28.3351 10.928 26.7876 10.928 25.1961C10.928 23.6047 11.2024 22.0571 11.6853 20.6083V14.3522H3.61822C1.98285 17.612 1.04993 21.2998 1.04993 25.1961C1.04993 29.0925 1.98285 32.7803 3.61822 36.04L11.6853 29.7839Z"
        fill="#FBBC05"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25.196 10.6532C28.7411 10.6532 31.924 11.8715 34.4265 14.2641L41.3521 7.33853C37.1704 3.44218 31.7045 1.0495 25.196 1.0495C15.757 1.0495 7.59109 6.46048 3.61792 14.352L11.685 20.6081C13.5838 14.9007 18.907 10.6532 25.196 10.6532Z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleGlyph({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 51 51" fill="none">
      <Path
        d="M44.6826 38.6844C43.9522 40.3716 43.0878 41.9246 42.0862 43.3525C40.7209 45.2991 39.603 46.6464 38.7415 47.3947C37.4061 48.6228 35.9752 49.2518 34.443 49.2876C33.3431 49.2876 32.0165 48.9746 30.4724 48.3396C28.9232 47.7077 27.4995 47.3947 26.1977 47.3947C24.8325 47.3947 23.3682 47.7077 21.802 48.3396C20.2335 48.9746 18.9698 49.3054 18.0037 49.3382C16.5344 49.4008 15.0699 48.754 13.608 47.3947C12.675 46.5809 11.508 45.1858 10.1099 43.2094C8.60989 41.0989 7.37667 38.6516 6.41055 35.8614C5.37586 32.8477 4.85718 29.9293 4.85718 27.104C4.85718 23.8676 5.55651 21.0762 6.95725 18.7371C8.05811 16.8582 9.52265 15.3761 11.3556 14.288C13.1886 13.2 15.1692 12.6455 17.302 12.6101C18.4691 12.6101 19.9995 12.9711 21.9013 13.6805C23.7978 14.3924 25.0155 14.7534 25.5494 14.7534C25.9485 14.7534 27.3013 14.3313 29.5945 13.4897C31.7632 12.7093 33.5935 12.3862 35.0929 12.5135C39.1559 12.8414 42.2084 14.4431 44.2384 17.3286C40.6046 19.5303 38.8071 22.6141 38.8429 26.5701C38.8757 29.6515 39.9935 32.2157 42.1905 34.2517C43.1861 35.1967 44.298 35.927 45.5351 36.4457C45.2668 37.2237 44.9836 37.9689 44.6826 38.6844ZM35.3641 2.01581C35.3641 4.431 34.4818 6.68605 32.723 8.7733C30.6006 11.2546 28.0334 12.6885 25.2495 12.4622C25.214 12.1725 25.1935 11.8675 25.1935 11.5471C25.1935 9.22849 26.2028 6.74716 27.9952 4.71833C28.8901 3.6911 30.0282 2.83697 31.4084 2.15562C32.7856 1.48443 34.0883 1.11325 35.3135 1.04968C35.3492 1.37256 35.3641 1.69545 35.3641 2.01578V2.01581Z"
        fill={palette.white}
      />
    </Svg>
  );
}

type SocialVariant = "light" | "dark" | "subtle";

const socialStyles: Record<
  SocialVariant,
  { container: string; text: string; spinner: string }
> = {
  light: {
    container: "bg-white",
    text: "text-gray-300",
    spinner: palette["gray-700"],
  },
  dark: {
    container: "border border-white/20 bg-gray-700",
    text: "text-white",
    spinner: palette.white,
  },
  subtle: {
    container: "border border-white/10",
    text: "text-gray-200",
    spinner: palette["gray-200"],
  },
};

function SocialButton({
  label,
  glyph,
  variant = "light",
  loading,
  disabled,
  onPress,
}: {
  label: string;
  glyph?: React.ReactNode;
  variant?: SocialVariant;
  loading?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const styles = socialStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(
        "h-14 w-full flex-row items-center rounded-lg px-5 active:opacity-80",
        styles.container,
        disabled && "opacity-50",
      )}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.spinner} />
      ) : (
        <>
          {glyph}
          <Text className={cn("ml-4 text-lg font-semibold", styles.text)}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
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
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices();
      }
      const result = await GoogleSignin.signIn();
      const idToken =
        (result as any)?.data?.idToken ?? (result as any)?.idToken;
      if (!idToken) throw new Error("no id token");
      await authService.socialLogin("google", idToken);
      await finishAuth();
    } catch (err: any) {
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
    <SafeAreaView className="flex-1 justify-center bg-gray-700 px-6">
      <View className="items-center">
        <Text className="text-5xl font-extrabold text-purple-300">SHADOW</Text>
        <Text className="-mt-2 text-5xl font-extrabold text-white">
          LEVELING
        </Text>
        <Text
          className="mt-4 text-base font-semibold uppercase text-gray-200"
          style={{ letterSpacing: 2 }}
        >
          Entre para evoluir
        </Text>
      </View>

      <View className="mt-10">
        <View className="gap-3">
          <SocialButton
            label="Continuar com Google"
            glyph={<GoogleGlyph size={24} />}
            onPress={handleGoogle}
            loading={busy === "google"}
            disabled={busy !== null}
          />

          {appleAvailable && (
            <SocialButton
              label="Continuar com Apple"
              glyph={<AppleGlyph size={24} />}
              variant="dark"
              onPress={handleApple}
              loading={busy === "apple"}
              disabled={busy !== null}
            />
          )}

          <SocialButton
            label="Continuar com e-mail"
            glyph={
              <Mail size={24} color={palette["gray-200"]} strokeWidth={2} />
            }
            variant="subtle"
            onPress={() => router.push("/(auth)/email")}
            disabled={busy !== null}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
