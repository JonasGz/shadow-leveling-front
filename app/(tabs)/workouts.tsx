import { useCallback, useMemo, useState } from "react";
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
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Search from "lucide-react-native/icons/search";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import CalendarRange from "lucide-react-native/icons/calendar-range";
import Plus from "lucide-react-native/icons/plus";
import { Button } from "../../src/components/ui/Button";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { IconButton } from "../../src/components/ui/IconButton";
import { SearchInput } from "../../src/components/ui/SearchInput";
import { StartWorkoutButton } from "../../src/components/ui/StartWorkoutButton";
import { useWorkoutsStore } from "../../src/stores/workouts.store";
import { DAY_SHORT, dayOfWeekFromDate } from "../../src/lib/date";
import type { DayOfWeek, Workout } from "../../src/types/api.types";
import { color } from "../../src/theme/palette";
import { cn } from "../../src/lib/cn";

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
        borderLeftColor: color["purple-300"], // secondary
        overflow: "hidden",
        borderWidth: 1,
        borderColor:
          "rgba(129, 19, 211, 0.35) rgba(129, 19, 211, 0.35) rgba(129, 19, 211, 0.35) rgb(129, 19, 211)",
      }}
    >
      <View className="gap-lg p-md">
        <Pressable onPress={() => router.push(`/workout/${workout.id}`)}>
          <View className="mb-1 flex-row items-start justify-between">
            <Text className="flex-1 pr-2 text-headline-mobile font-bold text-white">
              {workout.name}
            </Text>
            <Text className="text-label-sm uppercase tracking-widest text-purple-200">
              {workout.done_today ? "Feito" : "Ativo"}
            </Text>
          </View>
          {workout.description ? (
            <Text className="mb-md text-label-md text-gray-200">
              {workout.description}
            </Text>
          ) : null}
          <View className="flex-row gap-xl">
            <View className="flex-row items-center gap-1">
              <Dumbbell size={16} color={color["gray-300"]} />
              <Text className="text-label-sm text-gray-200">
                {exerciseCountLabel(workout)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <CalendarRange size={16} color={color["gray-300"]} />
              <Text className="text-label-sm text-gray-200">
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
      className={cn(
        "rounded-xl border border-white/7 bg-gray-600 p-md active:bg-gray-500",
        workout.active ? "" : "opacity-60",
      )}
    >
      <View className="mb-md flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-title-lg font-bold text-white">
            {workout.name}
          </Text>
          <Text className="mt-1 ps-5 text-label-sm text-gray-200">
            {daysLabel || "Sem dias definidos"}
          </Text>
        </View>
        <Pressable
          onPress={() => onDelete(workout)}
          hitSlop={8}
          className="-mr-1 -mt-1 h-8 w-8 items-center justify-center rounded-full bg-error/15 active:bg-error/30"
        >
          <Text className="text-base font-bold text-error">✕</Text>
        </Pressable>
      </View>

      <View className="mb-md flex-row items-center justify-between rounded-lg bg-gray-700 p-md">
        <View>
          <Text className="text-label-sm uppercase tracking-widest text-gray-400">
            Exercícios
          </Text>
          <Text className="text-center text-title-lg font-semibold text-white">
            {count}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-label-sm uppercase tracking-widest text-gray-400">
            Frequência
          </Text>
          <Text className="text-center text-title-lg font-semibold text-white">
            {workout.days_of_week.length}x / sem
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-sm">
        {workout.done_today ? (
          <View className="rounded bg-purple-300/15 px-2 py-1">
            <Text className="text-label-sm uppercase tracking-widest text-purple-300">
              Feito hoje
            </Text>
          </View>
        ) : null}
        {!workout.active ? (
          <View className="rounded px-2 py-1">
            <Text className="text-label-sm uppercase tracking-widest text-gray-200">
              Inativo
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function WorkoutsScreen() {
  const workouts = useWorkoutsStore((s) => s.workouts);
  const loading = useWorkoutsStore((s) => s.loading);
  const error = useWorkoutsStore((s) => s.error);
  const fetch = useWorkoutsStore((s) => s.fetch);
  const refresh = useWorkoutsStore((s) => s.refresh);
  const remove = useWorkoutsStore((s) => s.remove);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [today, setToday] = useState<DayOfWeek>(dayOfWeekFromDate);

  useFocusEffect(
    useCallback(() => {
      // Reavalia o dia atual a cada foco — cobre virada de meia-noite
      // e troca de fuso horário com o app aberto em segundo plano.
      setToday(dayOfWeekFromDate());
      // Primeira carga usa fetch (liga o spinner); focos seguintes usam
      // refresh, que atualiza em silêncio. getState evita pôr workouts nas
      // deps — isso re-dispararia o efeito a cada mudança da lista.
      if (useWorkoutsStore.getState().workouts.length === 0) fetch();
      else refresh();
    }, [fetch, refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setToday(dayOfWeekFromDate());
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

  return (
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      {/* TopAppBar */}
      <View className="h-16 flex-row items-center justify-between px-md">
        <View className="flex-row items-center gap-3">
          <Text className="text-title-xxl font-bold text-white">
            Meus Treinos
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/workout/create")}
          className="h-14 w-14 items-center justify-center rounded-full border border-white/7 bg-gray-600 active:bg-purple-300"
        >
          <Text className="text-3xl text-purple-300">＋</Text>
        </Pressable>
      </View>

      {loading && workouts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={color["purple-100"]} />
        </View>
      ) : error && workouts.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-md px-lg">
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
              tintColor={color["purple-100"]}
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
                <Text className="text-title-md font-bold text-white">Hoje</Text>
                <View className="h-2 w-2 rounded-full bg-purple-200" />
              </View>
              {todayWorkouts.map((w) => (
                <TodayWorkoutCard key={w.id} workout={w} />
              ))}
            </View>
          )}

          {/* Sua Biblioteca */}
          <View className="flex items-center justify-between">
            <Text className="text-title-md font-bold text-white">
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
                <Text className="text-label-md text-gray-200">Novo treino</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
