import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useFocusEffect, router } from "expo-router";
import {
  TriangleAlert,
  Calendar,
  Flame,
  TrendingUp,
} from "lucide-react-native";
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
import { metricsService } from "../../src/services/metrics.service";
import { authService } from "../../src/services/auth.service";
import { useAuthStore } from "../../src/stores/auth.store";
import type {
  TodayMetrics,
  UserLevel,
  WeeklySummary,
} from "../../src/types/api.types";

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
    <View className="flex-1 bg-surface-low rounded-2xl p-lg border border-card-border">
      <Icon size={26} color={iconColor} fill={iconFill ?? "none"} />
      <Text className="text-on-surface text-center font-extrabold text-title-xl mt-2">
        {value}
      </Text>
      <Text className="text-center text-label-md text-on-surface-variant mt-1">
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [metrics, setMetrics] = useState<TodayMetrics | null>(null);
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [m, w, lvl] = await Promise.all([
        metricsService.today(),
        metricsService.weekly().catch(() => null),
        authService.level().catch(() => null),
      ]);
      setMetrics(m);
      setWeekly(w);
      setLevel(lvl);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      setLoading(true);
      load();
    }, [load]),
  );

  // Prompt the user to define a weekly goal on first entry (coluna NULL).
  // "Definir depois" closes the modal; it reappears next visit until set.
  useEffect(() => {
    if (!loading && user && user.weekly_goal_days === null) {
      setGoalModalVisible(true);
    }
  }, [loading, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setNow(new Date());
    await load();
    setRefreshing(false);
  }, [load]);

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
          <Text className="text-title-xxl text-white font-bold">
            Hey, {name} 👋
          </Text>
        </View>
        <Pressable
          onPress={() => router.navigate("/(tabs)/profile")}
          className="w-14 h-14 rounded-full items-center justify-center overflow-hidden active:opacity-70"
          style={{ backgroundColor: "#9F1FFF" }}
        >
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Text className="text-white font-bold">{initials}</Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c8a3ff" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-lg gap-md">
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
          />
          <Button
            label="Tentar novamente"
            size="sm"
            onPress={() => {
              setLoading(true);
              load();
            }}
          />
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
              onPress={goalScheduled > 0 ? undefined : () => setGoalModalVisible(true)}
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
                  borderColor: "#9F1FFF4D",
                }}
              >
                <WeeklyGoalRing pct={goalPct} />
                <View className="flex-1">
                  <Text className="text-title-lg text-on-surface font-bold text-center">
                    Meta semanal
                  </Text>
                  <Text
                    className="text-body-sm mt-1 text-center"
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
            <Text className="text-title-lg text-white text-center font-bold mb-md">
              Treino de hoje
            </Text>

            {featured ? (
              <Pressable
                onPress={() => router.push(`/workout/${featured.id}`)}
                className="rounded-2xl overflow-hidden border border-card-border active:opacity-80"
                style={{ backgroundColor: "#1A191C" }}
              >
                <View
                  className="px-md py-md"
                  style={{ backgroundColor: "#6E00B3" }}
                >
                  <View
                    className="self-start px-2 py-1 mt-6 rounded-full"
                    style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
                  >
                    <Text className="text-white text-label-sm uppercase">
                      {featured.is_completed ? "Concluído" : "Próximo"}
                    </Text>
                  </View>
                </View>

                <View className="p-lg items-center">
                  <Text
                    className="text-title-xl text-on-surface font-bold"
                    numberOfLines={1}
                  >
                    {featured.name}
                  </Text>
                  <Text className="text-body-sm text-on-surface-variant mt-1">
                    {featured.estimated_duration_min} min ·{" "}
                    {featured.exercise_count} exercício
                    {featured.exercise_count === 1 ? "" : "s"}
                  </Text>

                  <View className="w-full mt-md">
                    <StartWorkoutButton
                      workoutId={featured.id}
                      done={featured.is_completed}
                    />
                  </View>
                </View>
              </Pressable>
            ) : (
              <View
                className="rounded-2xl p-lg items-center gap-md border border-card-border"
                style={{ backgroundColor: "#1A191C" }}
              >
                <Calendar size={36} color="#908D94" strokeWidth={1.5} />
                <View className="items-center">
                  <Text className="text-title-md text-on-surface font-semibold">
                    Nenhum treino para hoje
                  </Text>
                  <Text className="text-body-sm text-on-surface-variant mt-1">
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
          load();
        }}
      />
    </SafeAreaView>
  );
}
