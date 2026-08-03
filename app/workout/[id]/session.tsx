import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import Zap from "lucide-react-native/icons/zap";
import X from "lucide-react-native/icons/x";
import { Button } from "../../../src/components/ui/Button";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { useToast } from "../../../src/components/ui/Toast";
import { SubstituteExerciseModal } from "../../../src/components/SubstituteExerciseModal";
import { ExerciseChips } from "../../../src/components/session/ExerciseChips";
import { ExercisePage } from "../../../src/components/session/ExercisePage";
import { SessionClock } from "../../../src/components/session/SessionClock";
import type {
  LocalSet,
  SetField,
} from "../../../src/components/session/SetRow";
import { authService } from "../../../src/services/auth.service";
import { workoutsService } from "../../../src/services/workouts.service";
import { sessionsService } from "../../../src/services/sessions.service";
import {
  computeHint,
  prefillSets,
  type Hint,
  type LastSet,
} from "../../../src/features/progression";
import { useWorkoutsStore } from "../../../src/stores/workouts.store";
import { localCalendarDate } from "../../../src/lib/date";
import type {
  Exercise,
  SessionStatus,
  Workout,
  WorkoutExercise,
  WorkoutSession,
} from "../../../src/types/api.types";
import { color } from "../../../src/theme/palette";
import { cn } from "../../../src/lib/cn";

const FINISH_SHADOW = { boxShadow: "0px 6px 18px rgba(129, 19, 211, 0.4)" };

function sortedExercises(workout: Workout | null): WorkoutExercise[] {
  if (!workout) return [];
  return [...(workout.exercises ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
}

export default function WorkoutSessionScreen() {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const refreshWorkouts = useWorkoutsStore((s) => s.refresh);

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [bootError, setBootError] = useState(false);
  const [booting, setBooting] = useState(true);
  const [finishing, setFinishing] = useState(false);

  const [current, setCurrent] = useState(0);
  const [setsByExercise, setSetsByExercise] = useState<
    Record<string, LocalSet[]>
  >({});
  const [hintByExercise, setHintByExercise] = useState<Record<string, Hint>>(
    {},
  );

  const [swapByWorkoutExercise, setSwapByWorkoutExercise] = useState<
    Record<string, Exercise>
  >({});
  const [swapModalOpen, setSwapModalOpen] = useState(false);

  const pagerRef = useRef<FlatList<WorkoutExercise>>(null);
  const [pageWidth, setPageWidth] = useState(Dimensions.get("window").width);

  const boot = useCallback(async () => {
    if (!workoutId) return;
    setBooting(true);
    setBootError(false);
    try {
      const w = await workoutsService.get(workoutId);
      setWorkout(w);

      const [createdSession, lastDetail] = await Promise.all([
        sessionsService.create({
          workout_id: workoutId,
          date: localCalendarDate(),
          status: "incomplete",
        }),
        sessionsService.lastCompletedDetail(workoutId).catch(() => null),
      ]);

      const initial: Record<string, LocalSet[]> = {};
      const hints: Record<string, Hint> = {};
      for (const we of sortedExercises(w)) {
        const lastSets: LastSet[] = (lastDetail?.sets ?? [])
          .filter((s) => s.exercise_id === we.exercise_id)
          .map((s) => ({
            setNumber: s.set_number,
            reps: s.reps ?? null,
            weight: s.weight ?? null,
            duration: s.duration ?? null,
          }));
        const timed = we.exercise.type === "time";
        initial[we.id] = prefillSets(lastSets, we.sets, timed).map((row) => ({
          ...row,
          done: false,
        }));
        hints[we.id] = computeHint(lastSets, we.reps_max ?? null, timed);
      }
      setSetsByExercise(initial);
      setHintByExercise(hints);
      setSession(createdSession);
    } catch {
      setBootError(true);
    } finally {
      setBooting(false);
    }
  }, [workoutId]);

  useEffect(() => {
    boot();
  }, [boot]);

  const exercises = sortedExercises(workout);
  const activeEx = exercises[current];

  const totalSets = exercises.reduce(
    (sum, e) => sum + (setsByExercise[e.id]?.length ?? 0),
    0,
  );
  const doneSets = exercises.reduce(
    (sum, e) => sum + (setsByExercise[e.id]?.filter((s) => s.done).length ?? 0),
    0,
  );
  const progressPct =
    totalSets === 0 ? 0 : Math.round((doneSets / totalSets) * 100);

  const liveStateRef = useRef({
    sets: setsByExercise,
    swaps: swapByWorkoutExercise,
  });
  liveStateRef.current = {
    sets: setsByExercise,
    swaps: swapByWorkoutExercise,
  };

  const goTo = useCallback((index: number, count: number) => {
    const clamped = Math.max(0, Math.min(count - 1, index));
    setCurrent(clamped);
    pagerRef.current?.scrollToIndex({ index: clamped, animated: true });
  }, []);

  const updateSetField = useCallback(
    (weId: string, idx: number, field: SetField, value: string) => {
      setSetsByExercise((prev) => {
        const list = [...(prev[weId] ?? [])];
        list[idx] = { ...list[idx], [field]: value };
        return { ...prev, [weId]: list };
      });
    },
    [],
  );

  const toggleSetDone = useCallback(
    async (we: WorkoutExercise, idx: number) => {
      if (!session) return;

      const { sets, swaps } = liveStateRef.current;
      const set = (sets[we.id] ?? [])[idx];
      if (!set || set.done) return;

      const swapped = swaps[we.id] ?? null;
      const timed = (swapped ?? we.exercise).type === "time";
      const exerciseId = swapped?.id ?? we.exercise_id;

      try {
        const created = await sessionsService.addSet(session.id, {
          exercise_id: exerciseId,
          set_number: idx + 1,
          reps: timed ? null : set.reps ? parseInt(set.reps, 10) : null,
          weight: timed ? null : set.weight ? parseFloat(set.weight) : null,
          duration: timed && set.duration ? parseInt(set.duration, 10) : null,
        });
        setSetsByExercise((prev) => {
          const list = [...(prev[we.id] ?? [])];
          list[idx] = { ...list[idx], done: true, remoteId: created.id };
          return { ...prev, [we.id]: list };
        });
      } catch (err: any) {
        const status = err?.response?.status;
        showToast(
          status === 400
            ? "Dados da série inválidos."
            : "Erro ao registrar série.",
          "error",
        );
      }
    },
    [session, showToast],
  );

  const completeSetsBefore = useCallback(
    (we: WorkoutExercise, idx: number) => {
      const { sets } = liveStateRef.current;
      const list = sets[we.id] ?? [];
      const timed =
        (liveStateRef.current.swaps[we.id] ?? we.exercise).type === "time";
      for (let i = 0; i < idx && i < list.length; i++) {
        const s = list[i];
        const filled = timed
          ? s.duration.trim()
          : s.reps.trim() || s.weight.trim();
        if (!s.done && filled) toggleSetDone(we, i);
      }
    },
    [toggleSetDone],
  );

  const openSwapModal = useCallback(() => setSwapModalOpen(true), []);

  async function handleFinish() {
    if (!session) return;
    setFinishing(true);

    const status: SessionStatus = doneSets > 0 ? "complete" : "incomplete";

    try {
      let xp = 50;
      try {
        const lvl = await authService.level();
        xp = 50 + Math.min(lvl.current_streak * 5, 50);
      } catch {}

      await sessionsService.updateStatus(session.id, status);
      await refreshWorkouts();

      router.replace({
        pathname: "/session/[id]/complete",
        params: {
          id: session.id,
          workoutId: workoutId ?? "",
          xp: status === "complete" ? String(xp) : "",
        },
      });
    } catch {
      showToast("Erro ao finalizar o treino.", "error");
      setFinishing(false);
    }
  }

  function confirmQuit() {
    Alert.alert(
      "Encerrar treino?",
      "O progresso registrado será mantido, mas a sessão ficará incompleta.",
      [
        { text: "Continuar treino", style: "cancel" },
        {
          text: "Encerrar",
          style: "destructive",
          onPress: () => router.replace(`/workout/${workoutId}`),
        },
      ],
    );
  }

  if (booting) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-700">
        <ActivityIndicator size="large" color={color["purple-100"]} />
        <Text className="mt-4 text-base font-semibold uppercase text-gray-200">
          Preparando sessão...
        </Text>
      </SafeAreaView>
    );
  }

  if (bootError || !workout) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-gray-700 px-6">
        <EmptyState
          icon={TriangleAlert}
          title="Não foi possível iniciar"
          description="Verifique sua conexão e tente novamente."
        />
        <Button label="Tentar novamente" size="sm" onPress={boot} />
      </SafeAreaView>
    );
  }

  if (exercises.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-gray-700 px-6">
        <EmptyState
          icon={Dumbbell}
          title="Treino sem exercícios"
          description="Adicione exercícios antes de iniciar uma sessão."
        />
        <Button
          label="Voltar ao treino"
          size="sm"
          onPress={() => router.replace(`/workout/${workoutId}`)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      <View className="px-4 pt-2">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-3">
            <LinearGradient
              colors={[color["purple-300"], color["purple-400"]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0.87 }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 9999,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0px 0px 16px rgba(129, 19, 211, 0.5)",
              }}
            >
              <Zap size={20} color={color.white} fill={color.white} />
            </LinearGradient>
            <View className="flex-1">
              <Text
                className="text-2xl font-bold uppercase text-purple-200"
                numberOfLines={1}
              >
                {workout.name}
              </Text>
              <SessionClock running={session != null} />
            </View>
          </View>
          <Pressable
            onPress={confirmQuit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Encerrar treino"
            className="h-10 w-10 items-center justify-center rounded-lg border border-purple-300/30 bg-purple-300/10 active:opacity-70"
          >
            <X size={17} color={color["purple-100"]} />
          </Pressable>
        </View>
        <View className="mt-4 h-px bg-white/12" />
      </View>

      <ExerciseChips
        exercises={exercises}
        currentIndex={current}
        setsByExercise={setsByExercise}
        swapByWorkoutExercise={swapByWorkoutExercise}
        onSelect={(i) => goTo(i, exercises.length)}
      />

      <View className="px-4 pb-4">
        <View className="mb-2 flex-row items-end justify-between">
          <Text className="text-xs font-normal uppercase text-gray-200">
            Exercício {current + 1} de {exercises.length}
          </Text>
          <Text className="text-xs font-medium text-purple-200">
            {progressPct}% Concluído
          </Text>
        </View>
        <View className="h-2 w-full overflow-hidden rounded-full bg-gray-500">
          <LinearGradient
            colors={[color["purple-400"], color["purple-300"]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${progressPct}%`, height: "100%" }}
          />
        </View>
      </View>

      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View
          className="flex-1"
          onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
        >
          <FlatList
            ref={pagerRef}
            data={exercises}
            keyExtractor={(we) => we.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            getItemLayout={(_, i) => ({
              length: pageWidth,
              offset: pageWidth * i,
              index: i,
            })}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
              if (i !== current) setCurrent(i);
            }}
            renderItem={({ item: we }) => (
              <ExercisePage
                workoutExercise={we}
                swapped={swapByWorkoutExercise[we.id] ?? null}
                sets={setsByExercise[we.id] ?? []}
                hint={hintByExercise[we.id] ?? null}
                pageWidth={pageWidth}
                onChangeField={updateSetField}
                onToggleDone={toggleSetDone}
                onFocusRow={completeSetsBefore}
                onRequestSwap={openSwapModal}
              />
            )}
          />
        </View>
      </KeyboardAvoidingView>

      <View className="flex-row justify-center gap-2 pb-10">
        {exercises.map((we, i) => (
          <View
            key={we.id}
            className={cn(
              "h-1.5 rounded-full",
              i === current ? "w-5 bg-purple-200" : "w-1.5 bg-gray-500",
            )}
          />
        ))}
      </View>

      <View className="px-4 pb-8">
        <Button
          label="Finalizar treino"
          size="md"
          fullWidth
          style={FINISH_SHADOW}
          loading={finishing}
          onPress={handleFinish}
        />
      </View>

      <SubstituteExerciseModal
        visible={swapModalOpen}
        origin={activeEx?.exercise ?? null}
        onSelect={(sub) => {
          if (!activeEx) return;
          setSwapByWorkoutExercise((prev) => ({
            ...prev,
            [activeEx.id]: sub,
          }));
        }}
        onClose={() => setSwapModalOpen(false)}
      />
    </SafeAreaView>
  );
}
