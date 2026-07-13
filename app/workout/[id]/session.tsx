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
import {
  TriangleAlert,
  Dumbbell,
  Zap,
  Clock,
  Check,
  ChevronLeft,
} from "lucide-react-native";
import { Button } from "../../../src/components/ui/Button";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { useToast } from "../../../src/components/ui/Toast";
import { authService } from "../../../src/services/auth.service";
import { workoutsService } from "../../../src/services/workouts.service";
import { sessionsService } from "../../../src/services/sessions.service";
import { useWorkoutsStore } from "../../../src/stores/workouts.store";
import type {
  SessionStatus,
  Workout,
  WorkoutExercise,
  WorkoutSession,
} from "../../../src/types/api.types";

// Mesma correção de métrica usada em Input/SearchInput: sem isso o número
// fica caído dentro da caixa no Android.
const SET_FIELD_TEXT = {
  fontSize: 14,
  lineHeight: 16,
  includeFontPadding: false,
  fontWeight: "600" as const,
};

const FINISH_SHADOW = { boxShadow: "0px 6px 18px rgba(159, 31, 255, 0.4)" };

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
        (a, b) => a.sort_order - b.sort_order,
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
    const t = setTimeout(
      () => setRest((r) => (r == null ? null : r - 1)),
      1000,
    );
    return () => clearTimeout(t);
  }, [rest]);

  const exercises: WorkoutExercise[] = workout
    ? [...(workout.exercises ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const activeEx = exercises[current];
  const activeSets = activeEx ? (setsByExercise[activeEx.id] ?? []) : [];
  const isTime = activeEx?.exercise.type === "time";

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

  function updateSetField(
    idx: number,
    field: "weight" | "reps" | "duration",
    value: string,
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
        duration: isTime && set.duration ? parseInt(set.duration, 10) : null,
      });
      setSetsByExercise((prev) => {
        const list = [...(prev[activeEx.id] ?? [])];
        list[idx] = { ...list[idx], done: true, remoteId: created.id };
        return { ...prev, [activeEx.id]: list };
      });
      setRest(60); // inicia descanso ao concluir uma série
    } catch (err: any) {
      const status = err?.response?.status;
      showToast(
        status === 400
          ? "Dados da série inválidos."
          : "Erro ao registrar série.",
        "error",
      );
    }
  }

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
        <Button label="Tentar novamente" size="sm" onPress={boot} />
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
        <Button
          label="Voltar ao treino"
          size="sm"
          onPress={() => router.replace(`/workout/${workoutId}`)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* TopAppBar */}
      <View className="px-md pt-sm">
        <View className="flex-row justify-between items-center gap-2">
          <View className="flex-row items-center gap-3 flex-1">
            <LinearGradient
              colors={["#9F1FFF", "#6E00B3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0.87 }} // ≈ 150deg
              style={{
                width: 50,
                height: 50,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0px 0px 16px rgba(159, 31, 255, 0.5)",
              }}
            >
              <Zap size={20} color="#FFF" fill="#FFF" />
            </LinearGradient>
            <View className="flex-1">
              <Text
                className="text-title-lg text-secondary uppercase font-bold"
                numberOfLines={1}
              >
                {workout.name}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <Clock size={15} color="#908D94" />
                <Text className="text-label-md text-on-surface-variant">
                  {fmtClock(elapsed)}
                </Text>
              </View>
            </View>
          </View>
          <Button
            label="Encerrar"
            variant="destructive"
            size="sm"
            onPress={confirmQuit}
          />
        </View>
        <View className="h-px bg-[#FFFFFF14] mt-md" />
      </View>

      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          contentContainerClassName="px-md py-lg pb-32"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progresso */}
          <View className="mb-lg">
            <View className="flex-row justify-between items-end mb-2">
              <Text className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
                Exercício {current + 1} de {exercises.length}
              </Text>
              <Text className="text-label-sm font-bold text-secondary">
                {progressPct}% Concluído
              </Text>
            </View>
            <View className="h-2 w-full bg-surface-high rounded-full overflow-hidden">
              <LinearGradient
                colors={["#6E00B3", "#9F1FFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: `${progressPct}%`, height: "100%" }}
              />
            </View>
          </View>

          {/* Card do exercício ativo */}
          <View className="bg-surface-low border border-card-border rounded-2xl overflow-hidden mb-lg">
            {/* Faixa em gradiente com o nome do exercício */}
            <LinearGradient
              colors={["#9F1FFF", "#41006C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.34, y: 0.94 }} // ≈ 160deg
              style={{
                paddingHorizontal: 16,
                paddingTop: 18,
                paddingBottom: 15,
              }}
            >
              <Text
                className="text-title-xxl text-white font-extrabold"
                numberOfLines={2}
              >
                {activeEx?.exercise.name}
              </Text>
              <View className="flex-row items-center gap-2 mt-2.5">
                <View className="bg-black/30 px-2.5 py-1 rounded-full">
                  <Text className="text-[#E5D6FF] text-label-sm uppercase tracking-widest font-bold">
                    {isTime ? "Tempo" : "Força"}
                  </Text>
                </View>
                <Text className="text-white/90 text-label-md font-semibold">
                  {activeEx?.sets} séries
                  {isTime
                    ? activeEx?.duration
                      ? ` × ${activeEx.duration}s`
                      : ""
                    : activeEx?.reps_min != null
                      ? ` × ${activeEx.reps_min}${
                          activeEx.reps_max &&
                          activeEx.reps_max !== activeEx.reps_min
                            ? `–${activeEx.reps_max}`
                            : ""
                        } reps`
                      : ""}
                </Text>
              </View>
            </LinearGradient>

            {/* Grid de séries */}
            <View className="p-3.5">
              {/* Cabeçalho */}
              <View className="flex-row items-center gap-2 px-2 pb-3">
                <Text className="w-10 text-center text-label-sm uppercase tracking-widest text-outline-variant">
                  Série
                </Text>
                <Text className="flex-1 text-center text-label-sm uppercase tracking-widest text-outline-variant">
                  {isTime ? "Duração (s)" : "Peso (kg)"}
                </Text>
                {!isTime && (
                  <Text className="flex-1 text-center text-label-sm uppercase tracking-widest text-outline-variant">
                    Reps
                  </Text>
                )}
                <Text className="w-9 text-center text-label-sm uppercase tracking-widest text-outline-variant">
                  ✓
                </Text>
              </View>

              {/* Linhas */}
              {activeSets.map((set, idx) => {
                const isActiveRow =
                  !set.done && activeSets.findIndex((s) => !s.done) === idx;
                // altura vem do padding: h-[..] + py-* juntos zeram a área do texto
                const fieldClass = `py-3 rounded-lg border text-center ${
                  isActiveRow && !set.done
                    ? "bg-background border-primary/60 text-primary"
                    : "bg-[#151417] border-[#FFFFFF14] text-on-surface-variant"
                } ${set.done ? "opacity-50" : ""}`;

                return (
                  <View
                    key={idx}
                    className={`flex-row gap-2 items-center px-2 py-4 mt-1 rounded-xl border ${
                      isActiveRow
                        ? "bg-primary/10 border-primary/50"
                        : "border-transparent"
                    }`}
                  >
                    <Text
                      className={`w-8 text-center text-body-md font-bold ${
                        isActiveRow ? "text-secondary" : "text-outline"
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
                      placeholder="– –"
                      placeholderTextColor="#49474D"
                      style={SET_FIELD_TEXT}
                      className={`flex-1 ${fieldClass}`}
                    />

                    {!isTime && (
                      <TextInput
                        value={set.reps}
                        onChangeText={(v) => updateSetField(idx, "reps", v)}
                        editable={!set.done}
                        keyboardType="numeric"
                        placeholder="– –"
                        placeholderTextColor="#49474D"
                        style={SET_FIELD_TEXT}
                        className={`flex-1 ${fieldClass}`}
                      />
                    )}

                    <View className="w-9 items-center">
                      <Pressable
                        onPress={() => toggleSetDone(idx)}
                        disabled={set.done}
                        className={`w-[22px] h-[22px] rounded-full items-center justify-center border-2 ${
                          set.done
                            ? "bg-secondary/20 border-secondary"
                            : isActiveRow
                              ? "border-outline active:border-primary"
                              : "border-[#3A393E]"
                        }`}
                      >
                        {set.done && <Check size={12} color="#B26CFF" />}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Navegação entre exercícios */}
          <View className="flex-row gap-2.5 mt-lg">
            <Pressable
              onPress={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className={`flex-1 py-4 border border-[#FFFFFF29] rounded-xl flex-row items-center justify-center gap-1.5 active:opacity-80 ${
                current === 0 ? "opacity-40" : ""
              }`}
            >
              <ChevronLeft size={15} color="#B5B4B8" />
              <Text className="text-[#B5B4B8] text-label-md font-semibold">
                Anterior
              </Text>
            </Pressable>

            <View className="flex-[1.5]">
              {current < exercises.length - 1 ? (
                <Button
                  label="Próximo ›"
                  size="md"
                  fullWidth
                  style={FINISH_SHADOW}
                  onPress={() => setCurrent((c) => c + 1)}
                />
              ) : (
                <Button
                  label="Finalizar treino"
                  size="md"
                  fullWidth
                  style={FINISH_SHADOW}
                  loading={finishing}
                  onPress={handleFinish}
                />
              )}
            </View>
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
