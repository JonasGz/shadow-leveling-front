import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  type TextStyle,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "../../src/lib/image";
import {
  fetchGlobalRanking,
  type GlobalRanking,
  type GlobalRankingEntry,
} from "../../src/services/ranking.mock";
import { color } from "../../src/theme/palette";
import { cn } from "../../src/lib/cn";

const laurel = require("../../assets/images/goldenlaurel.png");

/** anel do 1º; o 2º/3º usam purple-300, um degrau abaixo */
const CHAMPION_RING = color["purple-grad-from"];

function initialOf(name: string) {
  return (name || "?").charAt(0).toUpperCase();
}

/**
 * Equivalente ao keyframe `rk-glow` do CSS: opacidade pulsando .55 → 1 → .55
 * em 3s, infinito. Não existe animação declarativa no RN, então vai por
 * Reanimated — um ciclo de 1.5s com `reverse` fecha os 3s de ida e volta.
 */
function useGlow() {
  const progress = useSharedValue(0.55);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  return useAnimatedStyle(() => ({ opacity: progress.value }));
}

const GOLD_NUMBER: TextStyle = {
  fontSize: 52,
  fontWeight: "800",
  lineHeight: 58,
  textAlign: "center",
};

/**
 * Número dourado do 1º lugar. O CSS usa `background-clip: text`, que não existe
 * no RN: o equivalente é o MaskedView — o texto vira máscara e o gradiente só
 * aparece dentro dele. O texto da máscara precisa ser opaco: o que vale é o
 * alfa, não a cor.
 *
 * O `<Text>` de baixo dá o tamanho ao container; o MaskedView por cima é que
 * aparece de fato.
 */
function GoldNumber({ value }: { value: number }) {
  return (
    <View>
      <Text style={[GOLD_NUMBER, { opacity: 0 }]}>{value}</Text>
      <MaskedView
        style={{ position: "absolute", inset: 0 }}
        maskElement={
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={[GOLD_NUMBER, { color: color.white }]}>{value}</Text>
          </View>
        }
      >
        <LinearGradient
          colors={["#FFE9A8", "#FFC53D", "#E8A320"]}
          locations={[0, 0.55, 1]}
          style={{ flex: 1 }}
        />
      </MaskedView>
    </View>
  );
}

function Avatar({
  entry,
  className,
  textClassName,
}: {
  entry: GlobalRankingEntry;
  className: string;
  textClassName: string;
}) {
  return entry.avatar_url ? (
    <Image
      source={{ uri: entry.avatar_url }}
      contentFit="cover"
      className={cn("rounded-full border-2 border-gray-700", className)}
    />
  ) : (
    <View
      className={cn(
        "items-center justify-center rounded-full border-2 border-gray-700 bg-gray-500",
        className,
      )}
    >
      <Text className={cn("font-extrabold text-purple-100", textClassName)}>
        {initialOf(entry.name)}
      </Text>
    </View>
  );
}

/** Bloco cinza do 2º/3º lugar: face frontal + topo em paralelogramo (skew). */
function RunnerBlock({
  position,
  level,
  faceStyle,
  topStyle,
}: {
  position: 2 | 3;
  level?: number;
  faceStyle: object;
  topStyle: object;
}) {
  return (
    <>
      <LinearGradient
        colors={[color["gray-500"], color["gray-700"]]}
        style={faceStyle}
      >
        {/* mesmo louro do 1º, recolorido de branco: tintColor pinta os pixels
            opacos e preserva o alfa do PNG */}
        <Image
          source={laurel}
          contentFit="contain"
          pointerEvents="none"
          tintColor={color.white}
          className="absolute top-1 h-[96px] w-[96px] opacity-10"
        />
        <Text className="text-5xl font-extrabold text-white/10">
          {position}
        </Text>
        {level != null && (
          <Text className="mt-4 text-xs font-bold text-gray-200">
            Nv. {level}
          </Text>
        )}
      </LinearGradient>
      <LinearGradient
        colors={["#38363d", color["gray-500"]]}
        style={topStyle}
      />
    </>
  );
}

function RunnerUp({
  entry,
  position,
}: {
  entry: GlobalRankingEntry;
  position: 2 | 3;
}) {
  return (
    <View
      className={cn(
        "absolute top-[171px] z-10 items-center gap-1",
        position === 2 ? "left-[48px]" : "right-[44px]",
      )}
    >
      {/* anel roxo como o do campeão; o padding é o que deixa a cor aparecer */}
      <View
        className="h-[56px] w-[56px] rounded-full p-[2px]"
        style={{ backgroundColor: color["purple-300"] }}
      >
        <Avatar
          entry={entry}
          className="h-full w-full"
          textClassName="text-xl"
        />
      </View>
      <Text className="text-xs font-bold text-white">{entry.name}</Text>
      <Text className="rounded-full border border-purple-200/40 bg-gray-600 px-3 py-[2px] text-xxs font-bold text-purple-200">
        {entry.title}
      </Text>
    </View>
  );
}

function Row({
  entry,
  position,
  highlighted,
}: {
  entry: GlobalRankingEntry;
  position: number;
  highlighted?: boolean;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-4 rounded-lg border px-4 py-3",
        highlighted
          ? "border-purple-grad-from bg-purple-grad-from/15"
          : "border-white/7 bg-gray-600",
      )}
      style={
        highlighted
          ? { boxShadow: "0 0 18px rgba(159,31,255,0.35)" }
          : undefined
      }
    >
      <Text
        className={cn(
          "w-[26px] text-center text-sm font-extrabold",
          highlighted ? "text-purple-100" : "text-gray-200",
        )}
      >
        {position}
      </Text>
      <Avatar entry={entry} className="h-11 w-11" textClassName="text-base" />
      <View className="flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-white">
          {entry.name}
        </Text>
        <Text
          className={cn(
            "text-xxs font-semibold",
            highlighted ? "text-purple-100" : "text-purple-200",
          )}
        >
          {entry.title}
        </Text>
      </View>
      <Text
        className={cn(
          "text-base font-extrabold",
          highlighted ? "text-white" : "text-purple-100",
        )}
      >
        Nv. {entry.level}
      </Text>
    </View>
  );
}

export default function RankingScreen() {
  const [data, setData] = useState<GlobalRanking | null>(null);
  const glow = useGlow();

  useEffect(() => {
    fetchGlobalRanking().then(setData);
  }, []);

  if (!data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-700">
        <ActivityIndicator color={color["purple-100"]} />
      </SafeAreaView>
    );
  }

  const [first, second, third] = data.entries;
  const rest = data.entries.slice(3);

  return (
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      <View className="items-center py-4">
        <Text className="text-2xl font-bold text-white">Ranking</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-[190px]">
        {/* Pódio 3D */}
        <View className="h-[400px]">
          <View className="absolute bottom-0 left-0 right-0 h-[220px] items-center">
            <View className="h-full w-[330px]">
              <RunnerBlock
                position={2}
                level={second?.level}
                faceStyle={{
                  position: "absolute",
                  left: -10,
                  top: 105,
                  width: 120,
                  height: 114,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
                topStyle={{
                  position: "absolute",
                  left: 0,
                  top: 71,
                  width: 120,
                  height: 34,
                  transform: [{ skewX: "-30deg" }],
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              />
              <RunnerBlock
                position={3}
                level={third?.level}
                faceStyle={{
                  position: "absolute",
                  right: -10,
                  top: 105,
                  width: 120,
                  height: 114,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
                topStyle={{
                  position: "absolute",
                  right: 0,
                  top: 71,
                  width: 120,
                  height: 34,
                  transform: [{ skewX: "30deg" }],
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              />

              {/* 1º lugar */}
              <View className="absolute bottom-[-9px] left-[101px] h-[186px] w-[128px]">
                <LinearGradient
                  colors={["rgba(202,164,255,0.55)", "rgba(159,31,255,0.30)"]}
                  style={{
                    position: "absolute",
                    top: -62,
                    width: 126,
                    height: 80,
                    transform: [{ perspective: 200 }, { rotateX: "62deg" }],
                    transformOrigin: "bottom center",
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    borderWidth: 1,
                    borderColor: "rgba(202,164,255,0.65)",
                  }}
                />
                {/* só a superfície pulsa; o conteúdo fica opaco por cima */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: "absolute",
                      top: 18,
                      width: 126,
                      height: 157,
                      borderWidth: 1,
                      borderColor: "rgba(202,164,255,0.65)",
                      backgroundColor: color["gray-600"],
                      boxShadow:
                        "0 0 34px rgba(159,31,255,0.5), inset 0 0 26px rgba(159,31,255,0.35)",
                    },
                    glow,
                  ]}
                >
                  <LinearGradient
                    colors={["rgba(159,31,255,0.45)", "rgba(159,31,255,0.10)"]}
                    style={{ flex: 1 }}
                  />
                </Animated.View>

                <View
                  style={{
                    position: "absolute",
                    top: 18,
                    width: 126,
                    height: 157,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 18,
                  }}
                >
                  <Image
                    source={laurel}
                    contentFit="contain"
                    pointerEvents="none"
                    className="absolute top-3 h-[118px] w-[118px]"
                  />
                  {first && (
                    <>
                      <GoldNumber value={1} />
                      <Text className="text-xs font-bold text-purple-100">
                        Nv. {first.level}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Campeão flutuante */}
          {first && (
            <View className="absolute left-0 right-0 top-[101px] z-20 items-center gap-1">
              <View
                className="h-[72px] w-[72px] rounded-full p-[2px]"
                style={{
                  backgroundColor: CHAMPION_RING,
                  boxShadow: "0 0 26px rgba(159,31,255,0.5)",
                }}
              >
                <Avatar
                  entry={first}
                  className="h-full w-full"
                  textClassName="text-2xl"
                />
              </View>
              <Text className="text-base font-extrabold text-white">
                {first.name}
              </Text>
              <Text className="rounded-full border border-purple-100 bg-gray-500 px-3 py-[3px] text-xxs font-bold text-purple-100">
                {first.title}
              </Text>
            </View>
          )}

          {second && <RunnerUp entry={second} position={2} />}
          {third && <RunnerUp entry={third} position={3} />}
        </View>

        <View className="mx-5 h-px bg-white/7" />

        <View className="gap-2 p-5">
          {rest.map((e, i) => (
            <Row key={e.user_id} entry={e} position={i + 4} />
          ))}
        </View>
      </ScrollView>

      {/* Minha posição, fixa acima da tab bar */}
      <View className="absolute bottom-[92px] left-0 right-0 bg-gray-700 px-5 pb-3 pt-3">
        <Row entry={data.me} position={data.my_position} highlighted />
      </View>
    </SafeAreaView>
  );
}
