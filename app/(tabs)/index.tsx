import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Calendar from "lucide-react-native/icons/calendar";
import Flame from "lucide-react-native/icons/flame";
import TrendingUp from "lucide-react-native/icons/trending-up";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { Button } from "../../src/components/ui/Button";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { StartWorkoutButton } from "../../src/components/ui/StartWorkoutButton";
import { WeeklyGoalModal } from "../../src/components/WeeklyGoalModal";
import { useScreenData } from "../../src/hooks/useScreenData";
import { metricsService } from "../../src/services/metrics.service";
import { authService } from "../../src/services/auth.service";
import { useAuthStore } from "../../src/stores/auth.store";

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function deriveName(nickname: string | null, email: string) {
  if (nickname && nickname.trim()) return titleCase(nickname.trim());
  if (email) {
    const local = email.split("@")[0].replace(/[._-]/g, " ");
    if (local) return titleCase(local);
  }
  return "Caçador";
}

function WeeklyGoalRing({ pct }: { pct: number }) {
  const size = 110;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circumference * (1 - clamped / 100);

  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgLinearGradient id="weeklyGoalGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6E00B3" />
          <Stop offset="1" stopColor="#B26CFF" />
        </SvgLinearGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#29282C"
        strokeWidth={stroke}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#weeklyGoalGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <SvgText
        fill="#fff"
        fontSize={22}
        fontWeight="800"
        textAnchor="middle"
        x={size / 2}
        y={size / 2 + 6}
      >{`${clamped}%`}</SvgText>
    </Svg>
  );
}

function StatCard({
  icon,
  iconColor,
  iconFill,
  value,
  label,
}: {
  icon: typeof Flame;
  iconColor: string;
  iconFill?: string;
  value: string;
  label: string;
}) {
  const Icon = icon;
  return (
    <View className="flex-1 rounded-2xl border border-card-border bg-surface-low p-lg">
      <Icon size={26} color={iconColor} fill={iconFill ?? "none"} />
      <Text className="mt-2 text-center text-title-xl font-extrabold text-on-surface">
        {value}
      </Text>
      <Text className="mt-1 text-center text-label-md text-on-surface-variant">
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  const {
    data,
    loading,
    error,
    refreshing,
    refresh: onRefresh,
    reload,
  } = useScreenData(async () => {
    const [metrics, weekly, level] = await Promise.all([
      metricsService.today(),
      metricsService.weekly().catch(() => null),
      authService.level().catch(() => null),
    ]);
    return { metrics, weekly, level };
  });

  const metrics = data?.metrics ?? null;
  const weekly = data?.weekly ?? null;
  const level = data?.level ?? null;

  // Prompt the user to define a weekly goal on first entry (coluna NULL).
  // "Definir depois" closes the modal; it reappears next visit until set.
  useEffect(() => {
    if (!loading && user && user.weekly_goal_days === null) {
      setGoalModalVisible(true);
    }
  }, [loading, user]);

  const email = user?.email ?? "";
  const name = deriveName(user?.nickname ?? null, email);
  const initials = initialsFromName(name || email);

  const goal = weekly?.goal;
  const goalCompleted = goal?.completed ?? 0;
  const goalScheduled = goal?.scheduled ?? 0;
  const goalPct =
    goalScheduled > 0
      ? Math.min(100, Math.round((goalCompleted / goalScheduled) * 100))
      : 0;

  const streak = level?.current_streak ?? 0;
  const rank = level?.rank ?? "E-Rank";
  const lvlNumber = level?.level ?? 0;

  const featured = useMemo(() => {
    const items = metrics?.workouts.items ?? [];
    if (items.length === 0) return null;
    const pending = items.find((w) => !w.is_completed);
    if (pending) return pending;
    return items[items.length - 1];
  }, [metrics]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-md py-md">
        <View>
          <Text className="text-title-xxl font-bold text-white">
            Hey, {name} 👋
          </Text>
        </View>
        <Pressable
          onPress={() => router.navigate("/(tabs)/profile")}
          className="h-14 w-14 items-center justify-center overflow-hidden rounded-full active:opacity-70"
          style={{ backgroundColor: "#8113D3" }}
        >
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Text className="font-bold text-white">{initials}</Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c8a3ff" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-md px-lg">
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar novamente" size="sm" onPress={reload} />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-md py-md gap-lg pb-[112px]"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#c8a3ff"
            />
          }
        >
          {/* Weekly goal card */}
          {weekly ? (
            <Pressable
              onPress={
                goalScheduled > 0 ? undefined : () => setGoalModalVisible(true)
              }
              disabled={goalScheduled > 0}
            >
              <LinearGradient
                colors={["rgb(42, 23, 48)", "rgb(26, 25, 28)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#8113D34D",
                }}
              >
                <WeeklyGoalRing pct={goalPct} />
                <View className="flex-1">
                  <Text className="text-center text-title-lg font-bold text-on-surface">
                    Meta semanal
                  </Text>
                  <Text
                    className="mt-1 text-center text-body-sm"
                    style={{ color: "#B5B4B8" }}
                  >
                    {goalScheduled === 0
                      ? "Defina sua meta semanal"
                      : goalCompleted >= goalScheduled
                        ? "Meta da semana concluída. Excelente!"
                        : `${goalCompleted} de ${goalScheduled} treinos feitos. Faltam ${Math.max(
                            0,
                            goalScheduled - goalCompleted,
                          )} pra completar!`}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          ) : null}

          {/* Stat cards */}
          <View className="flex-row gap-md">
            <StatCard
              icon={Flame}
              iconColor="#F59E0B"
              iconFill="#F59E0B"
              value={String(streak)}
              label="Dia de streak"
            />
            <StatCard
              icon={TrendingUp}
              iconColor="#B26CFF"
              value={rank}
              label={`Nível ${lvlNumber}`}
            />
          </View>

          {/* Today's workout */}
          <View>
            <Text className="mb-md text-center text-title-lg font-bold text-white">
              Treino de hoje
            </Text>

            {featured ? (
              <Pressable
                onPress={() => router.push(`/workout/${featured.id}`)}
                className="overflow-hidden rounded-2xl border border-card-border active:opacity-80"
                style={{ backgroundColor: "#1A191C" }}
              >
                <View
                  className="px-md py-md"
                  style={{ backgroundColor: "#6E00B3" }}
                >
                  <View
                    className="mt-6 self-start rounded-full px-2 py-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
                  >
                    <Text className="text-label-sm uppercase text-white">
                      {featured.is_completed ? "Concluído" : "Próximo"}
                    </Text>
                  </View>
                </View>

                <View className="items-center p-lg">
                  <Text
                    className="text-title-xl font-bold text-on-surface"
                    numberOfLines={1}
                  >
                    {featured.name}
                  </Text>
                  <Text className="mt-1 text-body-sm text-on-surface-variant">
                    {featured.estimated_duration_min} min ·{" "}
                    {featured.exercise_count} exercício
                    {featured.exercise_count === 1 ? "" : "s"}
                  </Text>

                  <View className="mt-md w-full">
                    <StartWorkoutButton
                      workoutId={featured.id}
                      done={featured.is_completed}
                    />
                  </View>
                </View>
              </Pressable>
            ) : (
              <View
                className="items-center gap-md rounded-2xl border border-card-border p-lg"
                style={{ backgroundColor: "#1A191C" }}
              >
                <Calendar size={36} color="#908D94" strokeWidth={1.5} />
                <View className="items-center">
                  <Text className="text-title-md font-semibold text-on-surface">
                    Nenhum treino para hoje
                  </Text>
                  <Text className="mt-1 text-body-sm text-on-surface-variant">
                    Aproveite para descansar ou criar um novo treino.
                  </Text>
                </View>
                <Button
                  label="Criar treino"
                  size="sm"
                  onPress={() => router.push("/workout/create")}
                />
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <WeeklyGoalModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onSaved={() => {
          setGoalModalVisible(false);
          reload();
        }}
      />
    </SafeAreaView>
  );
}
