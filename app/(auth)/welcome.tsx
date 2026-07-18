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
        <SafeAreaView className="flex-1 px-lg justify-between">
          <View className="items-center pt-xl">
            <Text className="text-title-xl text-on-surface font-bold tracking-tight">
              SHADOW{" "}
              <Text className="font-light text-on-surface-variant">
                Leveling
              </Text>
            </Text>
          </View>

          <View className="pb-md">
            <View className="flex-row justify-center gap-2 mb-4">
              {ATTRIBUTES.map((attr) => (
                <Badge key={attr} label={attr} tone="secondary" />
              ))}
            </View>

            <Text className="text-display-xxl text-on-surface text-center tracking-tight">
              Desperte{"\n"}Sua Força
            </Text>
            <Text className="text-body-lg text-on-surface-variant text-center mt-3">
              Evolua seus atributos todos os dias.
            </Text>

            <Pressable
              onPress={goToLogin}
              className="flex-row items-center justify-center gap-2 w-full h-16 mt-6 rounded-lg bg-primary active:opacity-80"
              style={{
                shadowColor: "#8113D3",
                shadowOpacity: 0.5,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              <Text className="text-body-lg uppercase text-on-primary font-bold">
                Evoluir Agora
              </Text>
              <ArrowRight size={18} color="#fff" />
            </Pressable>

            <Pressable
              onPress={goToLogin}
              className="items-center mt-3 p-2 active:opacity-60"
            >
              <Text className="text-body-md text-on-surface font-semibold">
                Já tenho conta · <Text className="text-secondary">Entrar</Text>
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
