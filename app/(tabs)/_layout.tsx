import { useState } from "react";
import { Tabs } from "expo-router";
import { View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import {
  Home,
  BicepsFlexed,
  Users,
  History,
  UserPen,
} from "lucide-react-native";

const TABS = [
  { name: "index", title: "Home", Icon: Home },
  { name: "workouts", title: "Treinos", Icon: BicepsFlexed },
  { name: "groups", title: "Grupos", Icon: Users },
  { name: "history", title: "Histórico", Icon: History },
  { name: "profile", title: "Perfil", Icon: UserPen },
];

export default function TabsLayout() {
  const active = useSharedValue(0);
  const barWidth = useSharedValue(0);
  const [ready, setReady] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);

  const pillStyle = useAnimatedStyle(() => {
    const slot = barWidth.value / TABS.length;
    return {
      width: slot,
      transform: [
        { translateX: withTiming(active.value * slot, { duration: 220 }) },
      ],
    };
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={({ state, navigation }) => (
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
            borderRadius: 36,
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
                  backgroundColor: "#d0bcff",
                  borderRadius: 38,
                  paddingHorizontal: 38,
                  paddingVertical: 36,
                  shadowColor: "#d0bcff",
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
                  active.value = withTiming(i, { duration: 220 });
                  setTimeout(() => setColorIndex(i), 220);
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
                <Icon size={26} color={colorIndex === i ? "#000" : "#958ea0"} />
              </Pressable>
            );
          })}
        </View>
      )}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title }} />
      ))}
    </Tabs>
  );
}
