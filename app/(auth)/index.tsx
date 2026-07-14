import { ImageBackground, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "../../src/components/ui/Button";

/**
 * Landing screen shown to signed-out users. A single "Evoluir agora" CTA leads
 * to the authentication options.
 */
export default function LandingScreen() {
  return (
    <ImageBackground
      source={require("../../assets/landing/bg-landing.jpg")}
      resizeMode="cover"
      className="flex-1"
    >
      <LinearGradient
        colors={["rgba(5,7,10,0.2)", "rgba(5,7,10,0.9)", "#1e0037"]}
        locations={[0, 0.7, 1]}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 px-lg justify-between">
          <View className="items-center pt-xl">
            <Text className="text-title-lg text-on-surface font-bold tracking-tight">
              SHADOW <Text className="font-light text-on-surface-variant">Leveling</Text>
            </Text>
          </View>

          <View className="items-center pb-md">
            <Text className="text-display-md text-on-surface font-black text-center tracking-tight">
              Desperte{"\n"}Sua Força
            </Text>
            <Text className="text-body-lg text-on-surface-variant text-center mt-3">
              Evolua seus atributos todos os dias.
            </Text>
          </View>

          <View className="pb-xl">
            <Button
              testID="landing-cta"
              label="Evoluir agora"
              onPress={() => router.push("/(auth)/login")}
              fullWidth
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
