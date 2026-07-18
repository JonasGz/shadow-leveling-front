import { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
// `Home` é alias de `House` no lucide v1; o módulo real é house.
import Home from "lucide-react-native/icons/house";
import Users from "lucide-react-native/icons/users";
import History from "lucide-react-native/icons/history";
import UserPen from "lucide-react-native/icons/user-pen";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import { color } from "../../src/theme/palette";

const TABS = [
  { name: "index", title: "Home", Icon: Home },
  { name: "workouts", title: "Treinos", Icon: Dumbbell },
  { name: "groups", title: "Grupos", Icon: Users },
  { name: "history", title: "Histórico", Icon: History },
  { name: "profile", title: "Perfil", Icon: UserPen },
];

const PILL_DURATION = 220;

function TabBar({ state, navigation }: BottomTabBarProps) {
  const active = useSharedValue(state.index);
  const barWidth = useSharedValue(0);
  const [ready, setReady] = useState(false);
  const [colorIndex, setColorIndex] = useState(state.index);

  // A aba focada manda na pílula: assim a barra acompanha também as navegações
  // que não vêm de um toque nela (ex.: o avatar da home abrindo o perfil).
  useEffect(() => {
    active.value = withTiming(state.index, { duration: PILL_DURATION });
    const t = setTimeout(() => setColorIndex(state.index), PILL_DURATION);
    return () => clearTimeout(t);
  }, [state.index, active]);

  const pillStyle = useAnimatedStyle(() => {
    const slot = barWidth.value / TABS.length;
    return {
      width: slot,
      transform: [{ translateX: active.value * slot }],
    };
  });

  return (
    <View
      onLayout={(e) => {
        barWidth.value = e.nativeEvent.layout.width;
        setReady(true);
      }}
      style={{
        marginTop: 32,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        backgroundColor: "rgba(0, 0, 0, 0.88)",
        height: 60,
        marginBottom: 32,
        marginHorizontal: 26,
        borderRadius: 9999, // pilula: altura 60
      }}
    >
      {ready && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              alignItems: "center",
              justifyContent: "center",
            },
            pillStyle,
          ]}
        >
          <View
            style={{
              backgroundColor: color["purple-300"],
              borderRadius: 9999, // pilula
              paddingHorizontal: 38,
              paddingVertical: 36,
              shadowColor: color["purple-300"],
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
              elevation: 4,
            }}
          />
        </Animated.View>
      )}

      {state.routes.map((route, i) => {
        const isFocused = state.index === i;
        const Icon = TABS[i].Icon;
        return (
          <Pressable
            key={route.key}
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
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              size={26}
              color={colorIndex === i ? color.white : color["gray-200"]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title }} />
      ))}
    </Tabs>
  );
}
