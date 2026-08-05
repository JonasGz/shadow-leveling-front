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
import Home from "lucide-react-native/icons/house";
import Users from "lucide-react-native/icons/users";
import History from "lucide-react-native/icons/history";
import Trophy from "lucide-react-native/icons/trophy";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import { color } from "../../src/theme/palette";

const TABS = [
  { name: "index", title: "Home", Icon: Home },
  { name: "workouts", title: "Treinos", Icon: Dumbbell },
  { name: "groups", title: "Grupos", Icon: Users },
  { name: "ranking", title: "Ranking", Icon: Trophy },
  { name: "history", title: "Histórico", Icon: History },
];

const DURATION = 260;

const BAR_H = 44;
const LIFT = 38;
const HUMP = -36;
const HUMP_WIDTH = 1.6;
const HUMP_TENSION = 0.5;
const CIRCLE_D = 64;
const CIRCLE_Y = 34;
const ICON_SCALE = 1.2;
const ICON_Y = LIFT + 22;
const RISE = CIRCLE_Y - ICON_Y;

const AnimatedPath = Animated.createAnimatedComponent(Path);

function focusAt(i: number, a: number) {
  "worklet";
  return Math.max(0, 1 - Math.abs(i - a));
}

function edges(w: number, cx: number, hw: number) {
  "worklet";
  return { left: Math.min(0, cx - hw), right: Math.max(w, cx + hw) };
}

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
    `C ${cx - ctrl} ${top} ${cx - ctrl} ${peak} ${cx} ${peak}`,
    `C ${cx + ctrl} ${peak} ${cx + ctrl} ${top} ${cx + hw} ${top}`,
    `L ${right} ${top}`,
  ].join(" ");
}

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
  const iconStyle = useAnimatedStyle(() => {
    const f = focusAt(index, active.value);
    return {
      opacity: 0.55 + 0.45 * f,
      transform: [
        { translateY: RISE * f },
        { scale: 1 + (ICON_SCALE - 1) * f },
      ],
    };
  });
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
            <AnimatedPath animatedProps={pathProps} fill={color["gray-600"]} />
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
                borderRadius: 9999,
                backgroundColor: color["purple-500"],
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
          // por nome, não por índice: uma rota escondida (href:null) não pode
          // deslocar o ícone das outras
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const { Icon, title } = tab;
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

function AssistantFab() {
  return (
    <Pressable
      onPress={() => router.push("/ai")}
      accessibilityRole="button"
      accessibilityLabel="Criar treino com IA"
      className="absolute bottom-32 right-6 z-50"
    >
      <View className="h-15 w-15 items-center justify-center rounded-full bg-purple-300">
        <Svg width={26} height={26} viewBox="0 0 24 24" fill={color.white}>
          <Path d="M9.9 4.6 11.5 9l4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4L3.9 10.6l4.4-1.6 1.6-4.4Z" />
          <Path d="M18 3.5l.75 2 2 .75-2 .75-.75 2-.75-2-2-.75 2-.75.75-2Z" />
          <Path d="M18.5 14.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" />
        </Svg>
      </View>
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
        {/* Perfil saiu da tab bar: entra pelo avatar da topbar. href:null tira
            da barra sem desalinhar TABS[i] de state.routes. */}
        <Tabs.Screen name="profile" options={{ href: null, title: "Perfil" }} />
      </Tabs>
      <AssistantFab />
    </View>
  );
}
