import { ImageBackground, View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import ArrowRight from "lucide-react-native/icons/arrow-right";
import { Badge } from "../../src/components/ui/Badge";

const ATTRIBUTES = ["Força", "Resistência", "Foco"];

/**
 * Landing screen shown to signed-out users. Both CTAs lead to the same
 * login-or-register flow at /(auth)/login.
 */
export default function LandingScreen() {
  const goToLogin = () => router.push("/(auth)/login");

  return (
    <ImageBackground
      source={require("../../assets/landing/bg-landing.jpg")}
      resizeMode="cover"
      className="flex-1"
    >
      {/* ponytail: the mockup's animated radial purple aura + mix-blend-mode
          isn't expressible with expo-linear-gradient. Approximated here with a
          purple-tinted linear stack; upgrade to a radial-gradient lib or a
          blurred absolute View if the glow needs to be stronger. */}
      <LinearGradient
        colors={["rgb(25, 3, 42)", "rgba(27, 24, 28, 0.868)", "#130023"]}
        locations={[0, 0.55, 1]}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 justify-between px-lg">
          <View className="items-center pt-xl">
            <Text className="text-title-xl font-bold tracking-tight text-on-surface">
              SHADOW{" "}
              <Text className="font-light text-on-surface-variant">
                Leveling
              </Text>
            </Text>
          </View>

          <View className="pb-md">
            <View className="mb-4 flex-row justify-center gap-2">
              {ATTRIBUTES.map((attr) => (
                <Badge key={attr} label={attr} tone="secondary" />
              ))}
            </View>

            <Text className="text-center text-display-xxl tracking-tight text-on-surface">
              Desperte{"\n"}Sua Força
            </Text>
            <Text className="mt-3 text-center text-body-lg text-on-surface-variant">
              Evolua seus atributos todos os dias.
            </Text>

            <Pressable
              onPress={goToLogin}
              className="mt-6 h-16 w-full flex-row items-center justify-center gap-2 rounded-lg bg-primary active:opacity-80"
              style={{
                shadowColor: "#8113D3",
                shadowOpacity: 0.5,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              <Text className="text-body-lg font-bold uppercase text-on-primary">
                Evoluir Agora
              </Text>
              <ArrowRight size={18} color="#fff" />
            </Pressable>

            <Pressable
              onPress={goToLogin}
              className="mt-3 items-center p-2 active:opacity-60"
            >
              <Text className="text-body-md font-semibold text-on-surface">
                Já tenho conta · <Text className="text-secondary">Entrar</Text>
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
