import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { TriangleAlert, Dumbbell } from "lucide-react-native";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { useToast } from "../../../src/components/ui/Toast";
import { workoutsService } from "../../../src/services/workouts.service";
import { sessionsService } from "../../../src/services/sessions.service";
import type {
  Workout,
  WorkoutExercise,
  WorkoutSession,
} from "../../../src/types/api.types";

function fmtClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface LocalSet {
  weight: string;
  reps: string;
  duration: string;
  done: boolean;
  remoteId?: string;
}

export default function WorkoutSessionScreen() {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();

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

  // Cronômetro da sessão
  const [elapsed, setElapsed] = useState(0);
  // Timer de descanso (null = oculto)
  const [rest, setRest] = useState<number | null>(null);

  // --- Bootstrap: carrega workout e cria a sessão ---
  const boot = useCallback(async () => {
    if (!workoutId) return;
    setBooting(true);
    setBootError(false);
    try {
      const w = await workoutsService.get(workoutId);
      setWorkout(w);

      const sorted = [...(w.exercises ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      const initial: Record<string, LocalSet[]> = {};
      for (const we of sorted) {
        initial[we.id] = Array.from({ length: Math.max(1, we.sets) }, () => ({
          weight: "",
          reps: "",
          duration: "",
          done: false,
        }));
      }
      setSetsByExercise(initial);

      const s = await sessionsService.create({
        workout_id: workoutId,
        date: new Date().toISOString(),
        status: "incomplete",
      });
      setSession(s);
    } catch {
      setBootError(true);
    } finally {
      setBooting(false);
    }
  }, [workoutId]);

  useEffect(() => {
    boot();
  }, [boot]);

  // Cronômetro da sessão (1s)
  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [session]);

  // Timer de descanso
  useEffect(() => {
    if (rest == null) return;
    if (rest <= 0) {
      setRest(null);
      return;
    }
    const t = setTimeout(() => setRest((r) => (r == null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  const exercises: WorkoutExercise[] = workout
    ? [...(workout.exercises ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order
      )
    : [];
  const activeEx = exercises[current];
  const activeSets = activeEx ? setsByExercise[activeEx.id] ?? [] : [];
  const isTime = activeEx?.exercise.type === "time";

  const totalSets = exercises.reduce(
    (sum, e) => sum + (setsByExercise[e.id]?.length ?? 0),
    0
  );
  const doneSets = exercises.reduce(
    (sum, e) =>
      sum + (setsByExercise[e.id]?.filter((s) => s.done).length ?? 0),
    0
  );
  const progressPct =
    totalSets === 0 ? 0 : Math.round((doneSets / totalSets) * 100);

  function updateSetField(
    idx: number,
    field: "weight" | "reps" | "duration",
    value: string
  ) {
    if (!activeEx) return;
    setSetsByExercise((prev) => {
      const list = [...(prev[activeEx.id] ?? [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, [activeEx.id]: list };
    });
  }

  async function toggleSetDone(idx: number) {
    if (!activeEx || !session) return;
    const set = activeSets[idx];
    if (set.done) return; // já registrado

    try {
      const created = await sessionsService.addSet(session.id, {
        exercise_id: activeEx.exercise_id,
        set_number: idx + 1,
        reps: isTime ? null : set.reps ? parseInt(set.reps, 10) : null,
        weight: isTime ? null : set.weight ? parseFloat(set.weight) : null,
        duration:
          isTime && set.duration ? parseInt(set.duration, 10) : null,
      });
      setSetsByExercise((prev) => {
        const list = [...(prev[activeEx.id] ?? [])];
        list[idx] = { ...list[idx], done: true, remoteId: created.id };
        return { ...prev, [activeEx.id]: list };
      });
      setRest(45); // inicia descanso ao concluir uma série
    } catch (err: any) {
      const status = err?.response?.status;
      showToast(
        status === 400 ? "Dados da série inválidos." : "Erro ao registrar série.",
        "error"
      );
    }
  }

  function handleFinish() {
    if (!session) return;
    setFinishing(true);
    // A confirmação do status e o PUT acontecem na tela de conclusão.
    router.replace({
      pathname: "/session/[id]/complete",
      params: { id: session.id, workoutId: workoutId ?? "" },
    });
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
      ]
    );
  }

  // --- Estados de carregamento / erro ---
  if (booting) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#c8a3ff" />
        <Text className="text-on-surface-variant text-label-md uppercase tracking-widest mt-md">
          Preparando sessão...
        </Text>
      </SafeAreaView>
    );
  }

  if (bootError || !workout) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-lg gap-md">
        <EmptyState
          icon={TriangleAlert}
          title="Não foi possível iniciar"
          description="Verifique sua conexão e tente novamente."
        />
        <Pressable
          onPress={boot}
          className="rounded bg-primary px-6 py-3 active:opacity-80"
        >
          <Text className="text-label-md uppercase tracking-widest text-on-primary font-semibold">
            Tentar novamente
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (exercises.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-lg gap-md">
        <EmptyState
          icon={Dumbbell}
          title="Treino sem exercícios"
          description="Adicione exercícios antes de iniciar uma sessão."
        />
        <Pressable
          onPress={() => router.replace(`/workout/${workoutId}`)}
          className="rounded bg-primary px-6 py-3 active:opacity-80"
        >
          <Text className="text-label-md uppercase tracking-widest text-on-primary font-semibold">
            Voltar ao treino
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-md h-16 border-b border-outline-variant">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-10 h-10 rounded-full border-2 border-primary bg-primary-container items-center justify-center">
            <Text className="text-on-primary text-base">⚡</Text>
          </View>
          <View className="flex-1">
            <Text
              className="text-title-md text-primary uppercase italic font-bold"
              numberOfLines={1}
            >
              {workout.name}
            </Text>
            <View className="flex-row items-center gap-1 opacity-80">
              <Text className="text-on-surface-variant text-[12px]">◷</Text>
              <Text className="text-label-sm text-on-surface-variant">
                {fmtClock(elapsed)}
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={confirmQuit}
          className="bg-error-container px-4 py-2 rounded-lg active:opacity-80"
        >
          <Text className="text-on-error-container text-label-md">
            Encerrar
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior="padding" className="flex-1">
      <ScrollView
        contentContainerClassName="px-md py-lg pb-32"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progresso */}
        <View className="mb-xl">
          <View className="flex-row justify-between items-end mb-2">
            <Text className="text-label-md text-on-surface-variant uppercase tracking-widest">
              Exercício {current + 1} de {exercises.length}
            </Text>
            <Text className="text-label-sm text-primary">
              {progressPct}% Concluído
            </Text>
          </View>
          <View className="h-2 w-full bg-surface-high rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{
                width: `${progressPct}%`,
                shadowColor: "#c8a3ff",
                shadowOpacity: 0.4,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
          </View>
        </View>

        {/* Card do exercício ativo */}
        <View className="bg-surface-low border border-outline-variant rounded-xl overflow-hidden mb-lg">
          {/* Header com gradiente roxo (no lugar da imagem) */}
          <View className="relative h-48 w-full">
            <LinearGradient
              colors={["#b06cff", "#6c00b2", "#1e0037"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />
            <LinearGradient
              colors={["transparent", "#1e0037"]}
              style={{ position: "absolute", inset: 0 }}
            />
            <View className="absolute bottom-4 left-4 right-4">
              <Text
                className="text-display-md text-on-surface uppercase font-black"
                numberOfLines={2}
              >
                {activeEx?.exercise.name}
              </Text>
              <View className="flex-row items-center gap-2 mt-1">
                <View className="bg-primary/20 px-2 py-0.5 rounded">
                  <Text className="text-primary text-label-sm uppercase">
                    {isTime ? "Tempo" : "Força"}
                  </Text>
                </View>
                <Text className="text-on-surface-variant text-label-md">
                  {activeEx?.sets} séries
                  {isTime
                    ? activeEx?.duration
                      ? ` × ${activeEx.duration}s`
                      : ""
                    : activeEx?.reps_min != null
                      ? ` × ${activeEx.reps_min}${
                          activeEx.reps_max && activeEx.reps_max !== activeEx.reps_min
                            ? `-${activeEx.reps_max}`
                            : ""
                        } reps`
                      : ""}
                </Text>
              </View>
            </View>
          </View>

          {/* Grid de séries */}
          <View className="p-4 gap-4">
            {/* Cabeçalho */}
            <View className="flex-row gap-2 px-2">
              <Text className="w-[16%] text-center text-on-surface-variant text-label-sm uppercase tracking-widest">
                Série
              </Text>
              <Text className="flex-1 text-center text-on-surface-variant text-label-sm uppercase tracking-widest">
                {isTime ? "Duração (s)" : "Peso (kg)"}
              </Text>
              {!isTime && (
                <Text className="flex-1 text-center text-on-surface-variant text-label-sm uppercase tracking-widest">
                  Reps
                </Text>
              )}
              <Text className="w-[16%] text-center text-on-surface-variant text-label-sm uppercase tracking-widest">
                Check
              </Text>
            </View>

            {/* Linhas */}
            {activeSets.map((set, idx) => {
              const isActiveRow =
                !set.done && activeSets.findIndex((s) => !s.done) === idx;
              return (
                <View
                  key={idx}
                  className={`flex-row gap-2 items-center p-2 rounded-lg border ${
                    set.done
                      ? "bg-surface-high/30 border-transparent"
                      : isActiveRow
                        ? "bg-surface-high border-primary"
                        : "bg-surface-high/30 border-transparent"
                  }`}
                  style={
                    isActiveRow
                      ? {
                          shadowColor: "#c8a3ff",
                          shadowOpacity: 0.1,
                          shadowRadius: 15,
                          shadowOffset: { width: 0, height: 0 },
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`w-[16%] text-center text-label-md ${
                      isActiveRow ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {idx + 1}
                  </Text>

                  <TextInput
                    value={isTime ? set.duration : set.weight}
                    onChangeText={(v) =>
                      updateSetField(idx, isTime ? "duration" : "weight", v)
                    }
                    editable={!set.done}
                    keyboardType="numeric"
                    placeholder="--"
                    placeholderTextColor="#3f006c"
                    className={`flex-1 bg-background border rounded p-2 text-center text-title-md ${
                      set.done
                        ? "border-outline-variant text-on-surface-variant opacity-50"
                        : isActiveRow
                          ? "border-primary text-primary"
                          : "border-outline-variant text-on-surface-variant"
                    }`}
                  />

                  {!isTime && (
                    <TextInput
                      value={set.reps}
                      onChangeText={(v) => updateSetField(idx, "reps", v)}
                      editable={!set.done}
                      keyboardType="numeric"
                      placeholder="--"
                      placeholderTextColor="#3f006c"
                      className={`flex-1 bg-background border rounded p-2 text-center text-title-md ${
                        set.done
                          ? "border-outline-variant text-on-surface-variant opacity-50"
                          : isActiveRow
                            ? "border-primary text-primary"
                            : "border-outline-variant text-on-surface-variant"
                      }`}
                    />
                  )}

                  <View className="w-[16%] items-center">
                    <Pressable
                      onPress={() => toggleSetDone(idx)}
                      disabled={set.done}
                      className={`w-8 h-8 rounded-full items-center justify-center border ${
                        set.done
                          ? "bg-secondary/20 border-secondary"
                          : "bg-surface-lowest border-outline-variant active:border-primary"
                      }`}
                    >
                      <Text
                        className={
                          set.done ? "text-secondary" : "text-on-surface-variant"
                        }
                      >
                        {set.done ? "✓" : "○"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Navegação entre exercícios */}
        <View className="flex-row gap-4 mt-lg">
          <Pressable
            onPress={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className={`flex-1 border border-outline-variant py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80 ${
              current === 0 ? "opacity-40" : ""
            }`}
          >
            <Text className="text-on-surface text-label-md">‹ Anterior</Text>
          </Pressable>

          {current < exercises.length - 1 ? (
            <Pressable
              onPress={() => setCurrent((c) => c + 1)}
              className="flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
              style={{
                shadowColor: "#c8a3ff",
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text className="text-on-primary text-label-md font-semibold">
                Próximo ›
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleFinish}
              disabled={finishing}
              className="flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
              style={{
                shadowColor: "#c8a3ff",
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              {finishing ? (
                <ActivityIndicator size="small" color="#e4d5ff" />
              ) : (
                <Text className="text-on-primary text-label-md font-semibold uppercase tracking-wider">
                  Finalizar treino
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Timer de descanso flutuante */}
      {rest != null && (
        <View
          className="absolute bottom-8 self-center bg-surface-high border border-secondary/50 rounded-full px-6 py-3 flex-row items-center gap-4"
          style={{
            left: 0,
            right: 0,
            marginHorizontal: "auto",
            maxWidth: 260,
            shadowColor: "#000",
            shadowOpacity: 0.5,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <Text className="text-secondary text-xl">☕</Text>
          <View className="flex-1">
            <Text className="text-label-sm text-on-surface-variant uppercase">
              Descanso
            </Text>
            <Text className="text-title-md text-secondary font-semibold leading-none">
              {fmtClock(rest)}
            </Text>
          </View>
          <Pressable
            onPress={() => setRest((r) => (r == null ? null : r + 15))}
            className="bg-surface-lowest w-8 h-8 rounded-full items-center justify-center border border-secondary/20 active:opacity-70"
          >
            <Text className="text-secondary text-base">＋</Text>
          </Pressable>
          <Pressable
            onPress={() => setRest(null)}
            className="bg-surface-lowest w-8 h-8 rounded-full items-center justify-center border border-secondary/20 active:opacity-70"
          >
            <Text className="text-secondary text-base">✕</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}