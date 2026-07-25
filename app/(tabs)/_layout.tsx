import { useEffect, useState } from "react";
import { Tabs, router } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// `Home` é alias de `House` no lucide v1; o módulo real é house.
import Home from "lucide-react-native/icons/house";
import Users from "lucide-react-native/icons/users";
import History from "lucide-react-native/icons/history";
import UserPen from "lucide-react-native/icons/user-pen";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import { LinearGradient } from "expo-linear-gradient";
import { color } from "../../src/theme/palette";

const TABS = [
  { name: "index", title: "Home", Icon: Home },
  { name: "workouts", title: "Treinos", Icon: Dumbbell },
  { name: "groups", title: "Grupos", Icon: Users },
  { name: "history", title: "Histórico", Icon: History },
  { name: "profile", title: "Perfil", Icon: UserPen },
];

const DURATION = 260;

// Geometria da barra. O eixo Y do SVG começa acima do topo da barra (LIFT) para
// caber a corcova e o círculo que sobe para fora dela.
const BAR_H = 44;
const LIFT = 38; // folga acima da barra
const HUMP = -36; // altura da corcova sob o círculo
// Os dois botões da curva no eixo horizontal:
// WIDTH: o quanto a corcova se espalha, em fatias de aba (1 = uma fatia).
// TENSION: onde ficam os pontos de controle dentro desse vão. Baixo (0.2) dá
// ombros retos e virada abrupta; alto (0.8) dá uma curva larga e macia.
const HUMP_WIDTH = 1.4;
const HUMP_TENSION = 0.5;
const CIRCLE_D = 64;
const CIRCLE_Y = 34; // centro do círculo no eixo do SVG
const ICON_SCALE = 1.2; // o quanto o ícone cresce ao virar o ativo
const ICON_Y = LIFT + 22; // centro do ícone quando está parado na barra
const RISE = CIRCLE_Y - ICON_Y; // negativo: o ícone ativo sobe para o círculo

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Quanto a aba `i` está ativa (1 = ativa, 0 = longe). Contínuo enquanto a
// corcova desliza, e soma 1 entre as duas abas envolvidas na transição.
function focusAt(i: number, a: number) {
  "worklet";
  return Math.max(0, 1 - Math.abs(i - a));
}

/** Onde o contorno começa e termina no eixo x, já contando o transbordo. */
function edges(w: number, cx: number, hw: number) {
  "worklet";
  return { left: Math.min(0, cx - hw), right: Math.max(w, cx + hw) };
}

/**
 * Só a aresta de cima: reta, corcova em `cx`, reta. Aberta (sem `Z`), para ser
 * traçada como a borda da barra — uma `border-t` não serviria, porque ela
 * precisa acompanhar a curva.
 *
 * `hw` é o mesmo em todas as abas — a corcova nunca muda de forma. Nas abas das
 * pontas ela passa da borda e o excedente sai do viewport do Svg, que recorta.
 * Limitar `hw` perto das bordas seria pior: na primeira aba ele colapsaria em
 * exatamente `cx` e a curva morreria em cima do canto da barra.
 */
function topEdgePath(w: number, cx: number, slot: number) {
  "worklet";
  const top = LIFT;
  const peak = LIFT - HUMP;
  const hw = (slot / 2) * HUMP_WIDTH;
  const ctrl = hw * HUMP_TENSION;
  const { left, right } = edges(w, cx, hw);
  return [
    `M ${left} ${top}`,
    `L ${cx - hw} ${top}`,
    // Duas cúbicas espelhadas: sobem até o platô e voltam ao nível da barra.
    `C ${cx - ctrl} ${top} ${cx - ctrl} ${peak} ${cx} ${peak}`,
    `C ${cx + ctrl} ${peak} ${cx + ctrl} ${top} ${cx + hw} ${top}`,
    `L ${right} ${top}`,
  ].join(" ");
}

/** A mesma aresta, fechada por baixo — é o que recebe o preenchimento. */
function barPath(w: number, cx: number, slot: number, bottom: number) {
  "worklet";
  const { left, right } = edges(w, cx, (slot / 2) * HUMP_WIDTH);
  return [
    topEdgePath(w, cx, slot),
    `L ${right} ${bottom}`,
    `L ${left} ${bottom}`,
    "Z",
  ].join(" ");
}

type TabProps = {
  Icon: (typeof TABS)[number]["Icon"];
  title: string;
  index: number;
  active: SharedValue<number>;
  onPress: () => void;
};

function Tab({ Icon, title, index, active, onPress }: TabProps) {
  // `scale` em vez de animar o `size` do ícone: o size do lucide é um atributo
  // de SVG, então mudá-lo remonta o ícone a cada frame na thread de JS.
  const iconStyle = useAnimatedStyle(() => {
    const f = focusAt(index, active.value);
    return {
      // Branco a 55% sobre gray-600 dá ~#9D9C9E, praticamente o gray-200 dos
      // ícones discretos — e sai de graça na UI thread, sem animar a prop
      // `color` do lucide (é atributo de SVG: remontaria o ícone por frame).
      opacity: 0.55 + 0.45 * f,
      transform: [
        { translateY: RISE * f },
        { scale: 1 + (ICON_SCALE - 1) * f },
      ],
    };
  });
  // O rótulo pertence à aba parada: some assim que ela começa a subir.
  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - focusAt(index, active.value),
  }));

  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: "center" }}>
      <Animated.View style={[{ marginTop: ICON_Y - 13 }, iconStyle]}>
        <Icon size={26} color={color.white} />
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        style={[
          // Animated.Text não tem cssInterop: estilo inline, valor da escala.
          { color: color["gray-200"], fontSize: 12, marginTop: 4 },
          labelStyle,
        ]}
      >
        {title}
      </Animated.Text>
    </Pressable>
  );
}

function TabBar({ state, navigation }: BottomTabBarProps) {
  const active = useSharedValue(state.index);
  const [width, setWidth] = useState(0);
  const insets = useSafeAreaInsets();

  // A aba focada manda na animação: assim a barra acompanha também as
  // navegações que não vêm de um toque nela (ex.: o avatar da home).
  useEffect(() => {
    active.value = withTiming(state.index, { duration: DURATION });
  }, [state.index, active]);

  const centerAt = (i: number) => {
    "worklet";
    return (width / TABS.length) * (i + 0.5);
  };

  const pathProps = useAnimatedProps(() => ({
    d: barPath(
      width,
      centerAt(active.value),
      width / TABS.length,
      LIFT + BAR_H + insets.bottom,
    ),
  }));

  const borderProps = useAnimatedProps(() => ({
    d: topEdgePath(width, centerAt(active.value), width / TABS.length),
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: centerAt(active.value) - CIRCLE_D / 2 }],
  }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: LIFT + BAR_H + insets.bottom,
      }}
    >
      {width > 0 && (
        <>
          <Svg
            width={width}
            height={LIFT + BAR_H + insets.bottom}
            style={{ position: "absolute" }}
          >
            {/* Mesma superfície de Card/modal/sheet: o roxo fica só no
                círculo, marcando a aba ativa. */}
            <AnimatedPath animatedProps={pathProps} fill={color["gray-600"]} />
            {/* A `border-white/7` do design system (a borda de container, mesma
                do Card). Em SVG ela é um traço no contorno, não uma classe:
                precisa acompanhar a corcova. */}
            <AnimatedPath
              animatedProps={borderProps}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
          </Svg>

          <Animated.View
            style={[
              {
                position: "absolute",
                top: CIRCLE_Y - CIRCLE_D / 2,
                left: 0,
                width: CIRCLE_D,
                height: CIRCLE_D,
                borderRadius: 9999, // círculo
                backgroundColor: color["purple-300"],
                shadowColor: color["purple-300"],
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 10,
                elevation: 6,
              },
              circleStyle,
            ]}
          />
        </>
      )}

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          paddingBottom: insets.bottom,
        }}
      >
        {state.routes.map((route, i) => {
          const isFocused = state.index === i;
          const { Icon, title } = TABS[i];
          return (
            <Tab
              key={route.key}
              Icon={Icon}
              title={title}
              index={i}
              active={active}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

/**
 * Atalho para o assistente de treino, flutuando sobre as abas.
 *
 * Fica acima do alcance do círculo da aba ativa (que sobe ~36px acima da
 * barra), senão colide com ele quando a última aba está selecionada.
 */
function AssistantFab() {
  return (
    <Pressable
      onPress={() => router.push("/ai")}
      accessibilityRole="button"
      accessibilityLabel="Criar treino com IA"
      className="absolute bottom-32 right-6 z-50"
    >
      <LinearGradient
        colors={[color["purple-grad-from"], color["purple-grad-to"]]}
        // 135° do CSS: canto superior esquerdo ao inferior direito.
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          // Dimensões explícitas, não `flex: 1`: o pai é absolute e o
          // gradiente colapsava para altura zero.
          width: 60,
          height: 60,
          borderRadius: 9999,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          // purple-100 a 35%, como no design.
          borderColor: "rgba(202,164,255,0.35)",
        }}
      >
        <Svg width={26} height={26} viewBox="0 0 24 24" fill={color.white}>
          <Path d="M9.9 4.6 11.5 9l4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4L3.9 10.6l4.4-1.6 1.6-4.4Z" />
          <Path d="M18 3.5l.75 2 2 .75-2 .75-.75 2-.75-2-2-.75 2-.75.75-2Z" />
          <Path d="M18.5 14.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" />
        </Svg>
      </LinearGradient>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
        tabBar={(props) => <TabBar {...props} />}
      >
        {TABS.map((t) => (
          <Tabs.Screen
            key={t.name}
            name={t.name}
            options={{ title: t.title }}
          />
        ))}
      </Tabs>
      <AssistantFab />
    </View>
  );
}
