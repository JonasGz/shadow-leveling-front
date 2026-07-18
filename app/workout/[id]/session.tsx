import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import Zap from "lucide-react-native/icons/zap";
import { Button } from "../../../src/components/ui/Button";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { useToast } from "../../../src/components/ui/Toast";
import { SubstituteExerciseModal } from "../../../src/components/SubstituteExerciseModal";
import { ExerciseChips } from "../../../src/components/session/ExerciseChips";
import { ExercisePage } from "../../../src/components/session/ExercisePage";
import { RestTimer } from "../../../src/components/session/RestTimer";
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

const REST_SECONDS = 60;

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

  // Índice do exercício atual e sets por exercício (keyed by workoutExercise.id)
  const [current, setCurrent] = useState(0);
  const [setsByExercise, setSetsByExercise] = useState<
    Record<string, LocalSet[]>
  >({});
  // Dica de progressão por exercício (keyed by workoutExercise.id).
  const [hintByExercise, setHintByExercise] = useState<Record<string, Hint>>(
    {},
  );

  // Trocas temporárias (Máquina Ocupada): mapeia workoutExercise.id → exercício
  // substituto escolhido para ESTA sessão. Não persiste em workout_exercises —
  // só afeta os exercise_sets registrados via addSet (Q15=A, Q19=A).
  const [swapByWorkoutExercise, setSwapByWorkoutExercise] = useState<
    Record<string, Exercise>
  >({});
  const [swapModalOpen, setSwapModalOpen] = useState(false);

  // Instante em que o último descanso começou; serve de `key` do RestTimer,
  // que remonta e reinicia a contagem. null = oculto.
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);

  // Pager horizontal: cada exercício é uma página que se arrasta pro lado.
  const pagerRef = useRef<FlatList<WorkoutExercise>>(null);
  const [pageWidth, setPageWidth] = useState(Dimensions.get("window").width);

  const boot = useCallback(async () => {
    if (!workoutId) return;
    setBooting(true);
    setBootError(false);
    try {
      const w = await workoutsService.get(workoutId);
      setWorkout(w);

      // Última sessão completa (autopreenchimento + dica). Em paralelo com a
      // criação da sessão; falha aqui não impede o treino (segue sem prefill).
      const [createdSession, lastDetail] = await Promise.all([
        sessionsService.create({
          workout_id: workoutId,
          // A sessão é datada pelo DIA LOCAL, não pelo instante UTC: um treino
          // às 22:31 (UTC-3) vira 01:31Z do dia seguinte, e `toISOString()`
          // gravaria a data errada na coluna DATE — fazendo `done_today`
          // acender no dia seguinte. Ver localCalendarDate.
          date: localCalendarDate(),
          status: "incomplete",
        }),
        sessionsService.lastCompletedDetail(workoutId).catch(() => null),
      ]);

      const initial: Record<string, LocalSet[]> = {};
      const hints: Record<string, Hint> = {};
      for (const we of sortedExercises(w)) {
        // Sets da última sessão para ESTE exercício (match por exercise_id).
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
  // Exercício sob o foco do pager (usado pelo modal de troca).
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

  // Espelho do estado que toggleSetDone precisa ler. Mantê-lo fora das deps é
  // o que deixa o callback estável — sem isso, digitar em uma série trocaria a
  // identidade da função e re-renderizaria todas as páginas memoizadas.
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

  // Estável de propósito: é prop do ExercisePage memoizado.
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
      if (!set || set.done) return; // já registrado

      // Quando há troca (máquina ocupada), grava o set contra o exercício
      // substituto. O workout_exercises original não muda — só os sets da sessão.
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
        setRestStartedAt(Date.now()); // inicia descanso ao concluir uma série
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

  const openSwapModal = useCallback(() => setSwapModalOpen(true), []);
  const dismissRest = useCallback(() => setRestStartedAt(null), []);

  async function handleFinish() {
    if (!session) return;
    setFinishing(true);

    // Sem nenhuma série registrada não houve treino de fato — o backend só
    // concede XP quando o status é "complete".
    const status: SessionStatus = doneSets > 0 ? "complete" : "incomplete";

    try {
      // O XP precisa ser calculado ANTES do PUT: a fórmula do backend usa o
      // streak atual (50 + min(streak * 5, 50)), que é incrementado ao concluir.
      let xp = 50;
      try {
        const lvl = await authService.level();
        xp = 50 + Math.min(lvl.current_streak * 5, 50);
      } catch {
        // sem /me/level: usa o XP base (sem bônus de streak)
      }

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
        <Text className="mt-4 text-label-md uppercase tracking-widest text-gray-200">
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
      {/* TopAppBar */}
      <View className="px-4 pt-2">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-3">
            <LinearGradient
              colors={[color["purple-300"], color["purple-400"]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0.87 }} // ≈ 150deg
              style={{
                width: 50,
                height: 50,
                borderRadius: 9999, // circulo: 50x50
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0px 0px 16px rgba(129, 19, 211, 0.5)",
              }}
            >
              <Zap size={20} color={color.white} fill={color.white} />
            </LinearGradient>
            <View className="flex-1">
              <Text
                className="text-title-lg font-bold uppercase text-purple-200"
                numberOfLines={1}
              >
                {workout.name}
              </Text>
              <SessionClock running={session != null} />
            </View>
          </View>
          <Button
            label="Encerrar"
            variant="destructive"
            size="sm"
            onPress={confirmQuit}
          />
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

      {/* Progresso */}
      <View className="px-4 pb-4">
        <View className="mb-2 flex-row items-end justify-between">
          <Text className="text-label-sm font-bold uppercase tracking-widest text-gray-200">
            Exercício {current + 1} de {exercises.length}
          </Text>
          <Text className="text-label-sm font-bold text-purple-200">
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
                onRequestSwap={openSwapModal}
              />
            )}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Dots de paginação */}
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

      {/* Finalizar sempre disponível — pode-se pular exercícios sem concluir */}
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

      {restStartedAt != null && (
        <RestTimer
          key={restStartedAt}
          seconds={REST_SECONDS}
          onDismiss={dismissRest}
        />
      )}

      {/* Modal de troca de exercício (Máquina Ocupada). Scope: sessão atual. */}
      <SubstituteExerciseModal
        visible={swapModalOpen}
        origin={activeEx?.exercise ?? null}
        onSelect={(sub) => {
          if (!activeEx) return;
          setSwapByWorkoutExercise((prev) => ({
            ...prev,
            [activeEx.id]: sub,
          }));
          showToast(
            `Trocando para ${sub.name} (só para esta sessão).`,
            "success",
          );
        }}
        onClose={() => setSwapModalOpen(false)}
      />
    </SafeAreaView>
  );
}
