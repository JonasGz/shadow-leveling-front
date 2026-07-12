import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { metricsService } from "../../src/services/metrics.service";
import { authService } from "../../src/services/auth.service";
import { useAuthStore } from "../../src/stores/auth.store";
import type { TodayMetrics, UserLevel } from "../../src/types/api.types";

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function fmtToday(d: Date) {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/**
 * Anel de progresso em RN puro (sem react-native-svg).
 * Usa duas metades rotacionadas que revelam o arco conforme o percentual.
 */
function ProgressRing({
  size = 192,
  stroke = 12,
  pct,
  label,
  value,
}: {
  size?: number;
  stroke?: number;
  pct: number;
  label: string;
  value: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const rightRotate = clamped <= 50 ? (clamped / 50) * 180 : 180;
  const leftRotate = clamped <= 50 ? 0 : ((clamped - 50) / 50) * 180;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {/* Trilha de fundo */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: "#353436",
        }}
      />
      {/* Metade direita */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          overflow: "hidden",
          left: size / 2,
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            marginLeft: -size / 2,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: "#d0bcff",
            borderLeftColor: "transparent",
            borderBottomColor: "transparent",
            transform: [{ rotate: `${rightRotate + 45}deg` }],
          }}
        />
      </View>
      {/* Metade esquerda (preenche acima de 50%) */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          overflow: "hidden",
          right: size / 2,
          alignItems: "flex-end",
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            marginRight: -size / 2,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: "#d0bcff",
            borderRightColor: "transparent",
            borderTopColor: "transparent",
            transform: [{ rotate: `${leftRotate - 135}deg` }],
          }}
        />
      </View>
      {/* Centro */}
      <View className="items-center justify-center">
        <Text className="text-display-md text-primary italic uppercase">
          {value}
        </Text>
        <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant">
          {label}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [metrics, setMetrics] = useState<TodayMetrics | null>(null);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    setError(false);
    try {
      const [m, lvl] = await Promise.all([
        metricsService.today(),
        authService.level().catch(() => null),
      ]);
      setMetrics(m);
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
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setNow(new Date());
    await load();
    setRefreshing(false);
  }, [load]);

  const email = user?.email ?? "";
  const generatedName = email ? email.split("@")[0].replace(/[._-]/g, " ") : "Caçador";
  const name = user?.nickname?.trim() || generatedName;
  const initial = (email[0] ?? "?").toUpperCase();

  const wp = metrics?.workouts.progress;
  const workoutPct =
    wp && wp.total > 0 ? Math.round((wp.completed / wp.total) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-md h-20 border-b border-outline-variant">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full border-2 border-primary bg-primary-container items-center justify-center">
            <Text className="text-on-primary font-bold">{initial}</Text>
          </View>
          <View>
            <Text className="text-title-md text-on-surface capitalize">
              {greeting(now)}, {name}!
            </Text>
            <Text className="text-label-md text-on-surface-variant">
              {fmtToday(now)}
            </Text>
          </View>
        </View>
        <Pressable className="w-10 h-10 items-center justify-center rounded-full active:opacity-60">
          <Text className="text-primary text-xl">◔</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#d0bcff" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-lg gap-md">
          <EmptyState
            icon="⚠️"
            title="Não foi possível carregar"
            description="Verifique sua conexão e tente novamente."
          />
          <Pressable
            onPress={() => {
              setLoading(true);
              load();
            }}
            className="rounded bg-primary px-6 py-3 active:opacity-80"
          >
            <Text className="text-label-md uppercase tracking-widest text-on-primary font-semibold">
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-md py-lg gap-xl pb-[112px]"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#d0bcff"
            />
          }
        >
          {/* Progresso de treino + nível */}
          <View className="bg-surface-low rounded-xl p-lg border border-outline-variant overflow-hidden">
            <View className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <View className="items-center gap-lg">
              <ProgressRing
                pct={workoutPct}
                value={`${wp?.completed ?? 0} / ${wp?.total ?? 0}`}
                label="Treinos"
              />

              <View className="w-full gap-md">
                <View>
                  <Text className="text-headline-mobile italic uppercase text-primary">
                    {level ? `Nível ${level.level}` : "Próximo Nível"}
                  </Text>
                  <Text className="text-body-md text-on-surface-variant mt-1">
                    {wp && wp.pending > 0
                      ? `Conclua ${wp.pending} treino${wp.pending > 1 ? "s" : ""} de hoje para evoluir.`
                      : "Treinos de hoje concluídos. Excelente!"}
                  </Text>
                </View>

                {level ? (
                  <View className="gap-sm">
                    <View className="flex-row justify-between">
                      <Text className="text-label-md text-on-surface uppercase">
                        Rank: {level.rank}
                      </Text>
                      <Text className="text-label-md text-on-surface">
                        {level.xp_into_level} / {level.xp_for_next_level} XP
                      </Text>
                    </View>
                    <View className="w-full h-3 bg-surface-highest rounded-full overflow-hidden">
                      <View
                        className="h-full bg-secondary rounded-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, level.progress_pct))}%`,
                          shadowColor: "#4cd7f6",
                          shadowOpacity: 0.5,
                          shadowRadius: 10,
                          shadowOffset: { width: 0, height: 0 },
                        }}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Treinos do Dia */}
          <View className="gap-md">
            <View className="flex-row justify-between items-end">
              <Text className="text-label-md uppercase tracking-widest text-primary">
                Treinos do Dia
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/workouts")}>
                <Text className="text-label-sm text-secondary uppercase">
                  Ver tudo
                </Text>
              </Pressable>
            </View>

            {!metrics || metrics.workouts.items.length === 0 ? (
              <EmptyState
                icon="🗓️"
                title="Nenhum treino para hoje"
                description="Aproveite para descansar ou criar um novo treino."
              />
            ) : (
              <View className="gap-md">
                {metrics.workouts.items.map((w) => (
                  <Pressable
                    key={w.id}
                    onPress={() => router.push(`/workout/${w.id}`)}
                    className={`bg-surface-container rounded-xl p-md flex-row items-center gap-md border border-outline-variant active:opacity-80 ${
                      w.is_completed ? "opacity-70" : ""
                    }`}
                  >
                    <View className="w-16 h-16 rounded-lg bg-surface-highest items-center justify-center">
                      <Text className="text-2xl">
                        {w.is_completed ? "✅" : "🏋️"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-title-md text-on-surface"
                        numberOfLines={1}
                      >
                        {w.name}
                      </Text>
                      <View className="flex-row gap-sm items-center mt-1">
                        {w.is_completed ? (
                          <View className="bg-secondary/10 px-2 py-0.5 rounded">
                            <Text className="text-secondary text-label-sm uppercase">
                              Concluído
                            </Text>
                          </View>
                        ) : (
                          <View className="bg-error-container/20 px-2 py-0.5 rounded">
                            <Text className="text-error text-label-sm uppercase">
                              Pendente
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {w.is_completed ? (
                      <Text className="text-secondary text-2xl">✓</Text>
                    ) : (
                      <Pressable
                        onPress={() =>
                          router.push(`/workout/${w.id}/session`)
                        }
                        className="w-10 h-10 rounded-full border border-outline-variant items-center justify-center active:bg-secondary"
                      >
                        <Text className="text-on-surface text-lg">▶</Text>
                      </Pressable>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* FAB contextual */}
      <Pressable
        onPress={() => router.push("/workout/create")}
        className="absolute right-md bottom-[112px] w-14 h-14 bg-primary rounded-xl items-center justify-center active:opacity-80"
        style={{
          shadowColor: "#d0bcff",
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <Text className="text-on-primary text-3xl -mt-1">＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}