import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useAuthStore } from "../../src/stores/auth.store";
import { useWorkoutsStore } from "../../src/stores/workouts.store";
import type { DayOfWeek, Workout } from "../../src/types/api.types";

const DAY_SHORT: Record<DayOfWeek, string> = {
  sunday: "Dom",
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
};

const DAY_INDEX: Record<number, DayOfWeek> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function exerciseCountLabel(w: Workout) {
  const n = w.exercises?.length ?? 0;
  return `${n} ${n === 1 ? "Exercício" : "Exercícios"}`;
}

/** Card destacado da seção "Programado para Hoje" */
function TodayWorkoutCard({ workout }: { workout: Workout }) {
  return (
    <View className="bg-surface-container rounded-xl border-l-4 border-secondary overflow-hidden">
      <View className="p-md gap-lg">
        <Pressable onPress={() => router.push(`/workout/${workout.id}`)}>
          <View className="flex-row justify-between items-start mb-1">
            <Text className="flex-1 text-headline-mobile text-on-surface font-bold pr-2">
              {workout.name}
            </Text>
            <Text className="text-label-sm uppercase tracking-widest text-secondary">
              {workout.done_today ? "Feito" : "Ativo"}
            </Text>
          </View>
          {workout.description ? (
            <Text className="text-label-md text-on-surface-variant mb-md">
              {workout.description}
            </Text>
          ) : null}
          <View className="flex-row gap-xl">
            <View className="flex-row items-center gap-1">
              <Text className="text-outline text-base">🏋</Text>
              <Text className="text-label-sm text-on-surface">
                {exerciseCountLabel(workout)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-outline text-base">◷</Text>
              <Text className="text-label-sm text-on-surface">
                {workout.days_of_week.length}x / sem
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push(`/workout/${workout.id}/session`)}
          className="w-full bg-secondary py-md rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
          style={{
            shadowColor: "#b06cff",
            shadowOpacity: 0.3,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Text className="text-on-secondary text-base">▶</Text>
          <Text className="text-on-secondary text-label-md uppercase tracking-wider font-semibold">
            Iniciar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Card da seção "Sua Biblioteca" */
function LibraryWorkoutCard({
  workout,
  onDelete,
}: {
  workout: Workout;
  onDelete: (workout: Workout) => void;
}) {
  const count = workout.exercises?.length ?? 0;
  const daysLabel = workout.days_of_week.map((d) => DAY_SHORT[d]).join(", ");

  return (
    <Pressable
      onPress={() => router.push(`/workout/${workout.id}`)}
      className={`bg-surface-container border border-outline-variant rounded-xl p-md active:bg-surface-high ${
        workout.active ? "" : "opacity-60"
      }`}
    >
      <View className="flex-row justify-between items-start mb-md">
        <View className="flex-1 pr-2">
          <Text className="text-title-md text-on-surface font-semibold">
            {workout.name}
          </Text>
          <Text className="text-label-sm text-on-surface-variant mt-1">
            {daysLabel || "Sem dias definidos"}
          </Text>
        </View>
        <Pressable
          onPress={() => onDelete(workout)}
          hitSlop={8}
          className="w-8 h-8 -mt-1 -mr-1 items-center justify-center rounded-full bg-error/15 active:bg-error/30"
        >
          <Text className="text-error text-base font-bold">✕</Text>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between bg-surface-lowest rounded-lg p-md mb-md">
        <View>
          <Text className="text-label-sm uppercase tracking-widest text-outline">
            Exercícios
          </Text>
          <Text className="text-title-md text-on-surface font-semibold">
            {count}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-label-sm uppercase tracking-widest text-outline">
            Frequência
          </Text>
          <Text className="text-title-md text-on-surface font-semibold">
            {workout.days_of_week.length}x / sem
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-sm">
        {workout.done_today ? (
          <View className="bg-primary/15 px-2 py-1 rounded">
            <Text className="text-label-sm text-primary uppercase tracking-widest">
              Feito hoje
            </Text>
          </View>
        ) : null}
        {!workout.active ? (
          <View className="bg-surface-variant px-2 py-1 rounded">
            <Text className="text-label-sm text-on-surface-variant uppercase tracking-widest">
              Inativo
            </Text>
          </View>
        ) : null}
        {workout.days_of_week.map((d) => (
          <View key={d} className="bg-surface-variant px-2 py-1 rounded">
            <Text className="text-label-sm text-on-surface-variant">
              {DAY_SHORT[d]}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export default function WorkoutsScreen() {
  const { workouts, loading, error, fetch, refresh, remove } =
    useWorkoutsStore();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  // Dia da semana lido do relógio local do dispositivo.
  const [today, setToday] = useState<DayOfWeek>(
    () => DAY_INDEX[new Date().getDay()],
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  useFocusEffect(
    useCallback(() => {
      // Reavalia o dia atual a cada foco — cobre virada de meia-noite
      // e troca de fuso horário com o app aberto em segundo plano.
      setToday(DAY_INDEX[new Date().getDay()]);
      refresh();
    }, [refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setToday(DAY_INDEX[new Date().getDay()]);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleDelete = useCallback(
    (workout: Workout) => {
      Alert.alert(
        "Excluir treino",
        `Tem certeza que deseja excluir "${workout.name}"? Os exercícios e o histórico de sessões serão removidos.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              try {
                await remove(workout.id);
              } catch {
                Alert.alert("Erro", "Não foi possível excluir o treino.");
              }
            },
          },
        ],
      );
    },
    [remove],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workouts;
    return workouts.filter((w) => w.name.toLowerCase().includes(q));
  }, [workouts, search]);

  const todayWorkouts = useMemo(
    () => filtered.filter((w) => w.active && w.days_of_week.includes(today)),
    [filtered, today],
  );
  const libraryWorkouts = useMemo(
    () => filtered.filter((w) => !todayWorkouts.includes(w)),
    [filtered, todayWorkouts],
  );

  const initial = (user?.email?.[0] ?? "?").toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-md h-16 border-b border-outline-variant">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-full bg-primary-container border border-primary items-center justify-center">
            <Text className="text-on-primary font-bold text-label-md">
              {initial}
            </Text>
          </View>
          <Text className="text-title-md uppercase tracking-tight text-primary font-semibold">
            Meus Treinos
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/workout/create")}
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-high active:bg-primary"
        >
          <Text className="text-primary text-2xl">＋</Text>
        </Pressable>
      </View>

      {loading && workouts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c8a3ff" />
        </View>
      ) : error && workouts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-lg gap-md">
          <EmptyState
            icon="⚠️"
            title="Não foi possível carregar"
            description={error}
          />
          <Pressable
            onPress={() => fetch()}
            className="rounded bg-primary px-6 py-3 active:opacity-80"
          >
            <Text className="text-label-md uppercase tracking-widest text-on-primary font-semibold">
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-md py-lg gap-lg pb-[112px]"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#c8a3ff"
            />
          }
        >
          {/* Busca */}
          <View className="bg-surface-lowest border border-outline-variant rounded-xl px-md py-sm flex-row items-center gap-sm">
            <Text className="text-on-surface-variant text-base">⌕</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar treino..."
              placeholderTextColor="#c8a3ff"
              className="flex-1 text-body-md text-on-surface"
            />
          </View>

          {/* Programado para Hoje */}
          {todayWorkouts.length > 0 && (
            <View className="gap-md">
              <View className="flex-row items-center justify-between">
                <Text className="text-label-md uppercase text-secondary tracking-[3px]">
                  Programado para Hoje
                </Text>
                <View className="w-2 h-2 rounded-full bg-secondary" />
              </View>
              {todayWorkouts.map((w) => (
                <TodayWorkoutCard key={w.id} workout={w} />
              ))}
            </View>
          )}

          {/* Sua Biblioteca */}
          <View className="gap-md">
            {libraryWorkouts.map((w) => (
              <LibraryWorkoutCard
                key={w.id}
                workout={w}
                onDelete={handleDelete}
              />
            ))}

            {filtered.length === 0 ? (
              <EmptyState
                icon={search ? "🔍" : "🏋️"}
                title={
                  search ? "Nenhum treino encontrado" : "Nenhum treino ainda"
                }
                description={
                  search
                    ? "Tente outro termo de busca."
                    : "Crie seu primeiro treino e comece a evoluir."
                }
              />
            ) : (
              /* Card tracejado "Novo Modelo de Treino" */
              <Pressable
                onPress={() => router.push("/workout/create")}
                className="border-2 border-dashed border-outline-variant rounded-xl p-md items-center justify-center min-h-[140px] gap-sm active:border-primary"
              >
                <Text className="text-outline text-4xl">＋</Text>
                <Text className="text-label-md uppercase tracking-widest text-on-surface-variant">
                  Novo Treino
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
