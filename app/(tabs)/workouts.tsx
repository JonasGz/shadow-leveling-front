import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TriangleAlert,
  Search,
  Dumbbell,
  CalendarRange,
  Plus,
} from "lucide-react-native";
import { Button } from "../../src/components/ui/Button";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { IconButton } from "../../src/components/ui/IconButton";
import { SearchInput } from "../../src/components/ui/SearchInput";
import { StartWorkoutButton } from "../../src/components/ui/StartWorkoutButton";
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
    <LinearGradient
      colors={["rgb(35, 21, 41)", "rgb(26, 25, 28)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 0.87 }} // ≈ 150deg
      // LinearGradient não aceita className (não é wrapped pelo NativeWind)
      style={{
        borderRadius: 20, // rounded-xl
        borderLeftWidth: 4,
        borderLeftColor: "#9F1FFF", // secondary
        overflow: "hidden",
        borderWidth: 1,
        borderColor:
          "rgba(159, 31, 255, 0.35) rgba(159, 31, 255, 0.35) rgba(159, 31, 255, 0.35) rgb(159, 31, 255)",
      }}
    >
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
              <Dumbbell size={16} color="#6C6971" />
              <Text className="text-label-sm text-on-surface-variant">
                {exerciseCountLabel(workout)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <CalendarRange size={16} color="#6C6971" />
              <Text className="text-label-sm text-on-surface-variant">
                {workout.days_of_week.length}x / sem
              </Text>
            </View>
          </View>
        </Pressable>

        <StartWorkoutButton workoutId={workout.id} done={workout.done_today} />
      </View>
    </LinearGradient>
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
      className={`bg-surface-container border border-card-border rounded-xl p-md active:bg-surface-high ${
        workout.active ? "" : "opacity-60"
      }`}
    >
      <View className="flex-row justify-between items-start mb-md">
        <View className="flex-1 pr-2">
          <Text className="text-title-md text-on-surface font-bold">
            {workout.name}
          </Text>
          <Text className="text-label-sm ps-5 text-on-surface-variant mt-1">
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
          <Text className="text-title-lg text-center text-on-surface font-semibold">
            {count}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-label-sm uppercase tracking-widest text-outline">
            Frequência
          </Text>
          <Text className="text-title-lg text-center text-on-surface font-semibold">
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
      <View className="flex-row justify-between items-center px-md h-16">
        <View className="flex-row items-center gap-3">
          <Text className="text-title-xxl text-white font-bold">
            Meus Treinos
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/workout/create")}
          className="w-14 h-14 items-center justify-center rounded-full border border-card-border active:bg-primary"
        >
          <Text className="text-primary text-3xl">＋</Text>
        </Pressable>
      </View>

      {loading && workouts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c8a3ff" />
        </View>
      ) : error && workouts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-lg gap-md">
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar"
            description={error}
          />
          <Button label="Tentar novamente" size="sm" onPress={() => fetch()} />
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
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar treino..."
          />

          {/* Programado para Hoje */}
          {todayWorkouts.length > 0 && (
            <View className="gap-md">
              <View className="flex-row items-center justify-between">
                <Text className="text-label-md text-on-surface font-bold">
                  Hoje
                </Text>
                <View className="w-2 h-2 rounded-full bg-secondary" />
              </View>
              {todayWorkouts.map((w) => (
                <TodayWorkoutCard key={w.id} workout={w} />
              ))}
            </View>
          )}

          {/* Sua Biblioteca */}
          <View className="flex justify-between items-center">
            <Text className="text-label-md text-on-surface font-bold">
              Outros treinos
            </Text>
          </View>
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
                icon={search ? Search : Dumbbell}
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
              /* Novo treino */
              <View className="items-center gap-sm pt-5">
                <IconButton
                  icon={Plus}
                  onPress={() => router.push("/workout/create")}
                />
                <Text className="text-label-md text-on-surface-variant">
                  Novo treino
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
