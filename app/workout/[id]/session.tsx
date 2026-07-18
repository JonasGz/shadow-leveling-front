import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  Dimensions,
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
  RotateCcw,
  Timer,
  Plus,
  X,
} from "lucide-react-native";
import { Button } from "../../../src/components/ui/Button";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { useToast } from "../../../src/components/ui/Toast";
import { SubstituteExerciseModal } from "../../../src/components/SubstituteExerciseModal";
import { authService } from "../../../src/services/auth.service";
import { workoutsService } from "../../../src/services/workouts.service";
import { sessionsService } from "../../../src/services/sessions.service";
import { useWorkoutsStore } from "../../../src/stores/workouts.store";
import type {
  Exercise,
  SessionStatus,
  Workout,
  WorkoutExercise,
  WorkoutSession,
} from "../../../src/types/api.types";

// Data (dia local) da sessão como meio-dia UTC daquele dia, para a coluna DATE
// do backend gravar o dia do calendário do usuário e não escorregar de fuso.
function localCalendarDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00:00.000Z`;
}

// Mesma correção de métrica usada em Input/SearchInput: sem isso o número
// fica caído dentro da caixa no Android.
const SET_FIELD_TEXT = {
  fontSize: 14,
  lineHeight: 16,
  includeFontPadding: false,
  fontWeight: "600" as const,
};

const FINISH_SHADOW = { boxShadow: "0px 6px 18px rgba(129, 19, 211, 0.4)" };

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

  // Trocas temporárias (Máquina Ocupada): mapeia workoutExercise.id → exercício
  // substituto escolhido para ESTA sessão. Não persiste em workout_exercises —
  // só afeta os exercise_sets registrados via addSet (Q15=A, Q19=A).
  const [swapByWorkoutExercise, setSwapByWorkoutExercise] = useState<
    Record<string, Exercise>
  >({});
  const [swapModalOpen, setSwapModalOpen] = useState(false);

  // Cronômetro da sessão
  const [elapsed, setElapsed] = useState(0);
  // Timer de descanso (null = oculto)
  const [rest, setRest] = useState<number | null>(null);

  // Pager horizontal: cada exercício é uma página que se arrasta pro lado.
  const pagerRef = useRef<FlatList<WorkoutExercise>>(null);
  const [pageWidth, setPageWidth] = useState(Dimensions.get("window").width);

  function goTo(index: number, count: number) {
    const clamped = Math.max(0, Math.min(count - 1, index));
    setCurrent(clamped);
    pagerRef.current?.scrollToIndex({ index: clamped, animated: true });
  }

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
        // A sessão é datada pelo DIA LOCAL, não pelo instante UTC: um treino às
        // 22:31 (UTC-3) vira 01:31Z do dia seguinte, e `toISOString()` gravaria
        // a data errada na coluna DATE — fazendo `done_today` acender no dia
        // seguinte. Enviamos meio-dia UTC do dia local (margem de ±12h contra o
        // fuso do banco) para a data truncada bater com o calendário do usuário.
        date: localCalendarDate(),
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

  function updateSetField(
    weId: string,
    idx: number,
    field: "weight" | "reps" | "duration",
    value: string,
  ) {
    setSetsByExercise((prev) => {
      const list = [...(prev[weId] ?? [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, [weId]: list };
    });
  }

  async function toggleSetDone(we: WorkoutExercise, idx: number) {
    if (!session) return;
    const set = (setsByExercise[we.id] ?? [])[idx];
    if (!set || set.done) return; // já registrado

    // Quando há troca (máquina ocupada), grava o set contra o exercício
    // substituto. O workout_exercises original não muda — só os sets da sessão.
    const swapped = swapByWorkoutExercise[we.id] ?? null;
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
              colors={["#8113D3", "#6E00B3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0.87 }} // ≈ 150deg
              style={{
                width: 50,
                height: 50,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0px 0px 16px rgba(129, 19, 211, 0.5)",
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

      {/* Chips: pular direto pra qualquer exercício da sessão */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerClassName="px-md pb-8 gap-2 py-3"
        keyboardShouldPersistTaps="handled"
      >
        {exercises.map((we, i) => {
          const name = (swapByWorkoutExercise[we.id] ?? we.exercise).name;
          const active = i === current;
          const sets = setsByExercise[we.id] ?? [];
          const allDone = sets.length > 0 && sets.every((s) => s.done);
          return (
            <Pressable
              key={we.id}
              onPress={() => goTo(i, exercises.length)}
              className={`w-36 h-24 px-3 py-2.5 rounded-xl border justify-between active:opacity-70 ${
                allDone
                  ? "bg-secondary/15 border-secondary/60"
                  : active
                    ? "bg-primary/20 border-primary/60"
                    : "bg-surface-low border-[#FFFFFF29]"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-label-sm font-bold ${
                    active ? "text-secondary" : "text-outline"
                  }`}
                >
                  {i + 1}
                </Text>
                {allDone && (
                  <View className="w-5 h-5 rounded-full bg-secondary/25 items-center justify-center">
                    <Check size={13} color="#B26CFF" strokeWidth={3} />
                  </View>
                )}
              </View>
              <Text
                className={`text-label-md font-semibold ${
                  active ? "text-on-surface" : "text-on-surface-variant"
                }`}
                numberOfLines={3}
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Progresso */}
      <View className="px-md pb-md">
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
            colors={["#6E00B3", "#8113D3"]}
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
            renderItem={({ item: we }) => {
              const swapped = swapByWorkoutExercise[we.id] ?? null;
              const effective = swapped ?? we.exercise;
              const sets = setsByExercise[we.id] ?? [];
              const timed = effective.type === "time";
              return (
                <ScrollView
                  style={{ width: pageWidth }}
                  contentContainerClassName="px-md py-sm pb-6"
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Card do exercício */}
                  <View className="bg-surface-low border border-card-border rounded-2xl overflow-hidden">
                    {/* Faixa em gradiente com o nome do exercício */}
                    <View className="p-lg bg-primary/20">
                      {/* Badge "substituído" aparece quando há troca ativa pra esta sessão */}
                      {swapped && (
                        <View className="flex-row items-center gap-1.5 mb-2 bg-secondary/20 border border-secondary/40 rounded-full px-2.5 py-1 self-start">
                          <RotateCcw size={11} color="#B26CFF" />
                          <Text className="text-label-sm text-secondary uppercase tracking-widest font-bold">
                            Substituído p/ hoje
                          </Text>
                        </View>
                      )}
                      <Text
                        className="text-title-xxl text-white font-extrabold"
                        numberOfLines={2}
                      >
                        {effective.name}
                      </Text>
                      {swapped && (
                        <Text className="text-label-sm text-white/50 mt-1 line-through">
                          {we.exercise.name}
                        </Text>
                      )}
                      <View className="flex-row items-center gap-2 mt-2.5 flex-wrap">
                        <View className="bg-black/30 px-2.5 py-1 rounded-full">
                          <Text className="text-[#E5D6FF] text-label-sm uppercase tracking-widest font-bold">
                            {timed ? "Tempo" : "Força"}
                          </Text>
                        </View>
                        <Text className="text-on-surface-variant text-label-md font-semibold">
                          {we.sets} séries
                          {timed
                            ? we.duration
                              ? ` × ${we.duration}s`
                              : ""
                            : we.reps_min != null
                              ? ` × ${we.reps_min}${
                                  we.reps_max && we.reps_max !== we.reps_min
                                    ? `–${we.reps_max}`
                                    : ""
                                } reps`
                              : ""}
                        </Text>
                        {/* Botão de troca (Máquina Ocupada). Oferece 3 sugeridos + busca. */}
                        <Pressable
                          onPress={() => setSwapModalOpen(true)}
                          className="bg-surface-lowest/60 border border-[#FFFFFF29] px-2.5 py-1 rounded-full active:opacity-70"
                        >
                          <Text className="text-white/90 text-label-sm uppercase tracking-widest font-bold">
                            Trocar (máquina ocupada)
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Grid de séries */}
                    <View className="p-3.5">
                      {/* Cabeçalho */}
                      <View className="flex-row items-center gap-2 px-2 pb-3">
                        <Text className="w-10 text-center text-label-sm uppercase tracking-widest text-outline-variant">
                          Série
                        </Text>
                        <Text className="flex-1 text-center text-label-sm uppercase tracking-widest text-outline-variant">
                          {timed ? "Duração (s)" : "Peso (kg)"}
                        </Text>
                        {!timed && (
                          <Text className="flex-1 text-center text-label-sm uppercase tracking-widest text-outline-variant">
                            Reps
                          </Text>
                        )}
                        <Text className="w-9 text-center text-label-sm uppercase tracking-widest text-outline-variant">
                          ✓
                        </Text>
                      </View>

                      {/* Linhas */}
                      {sets.map((set, idx) => {
                        const isActiveRow =
                          !set.done && sets.findIndex((s) => !s.done) === idx;
                        // altura vem do padding: h-[..] + py-* juntos zeram a área do texto
                        const fieldClass = `py-3 rounded-lg border text-center ${
                          isActiveRow && !set.done
                            ? "bg-background border-primary/60 text-[#fff]"
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
                              value={timed ? set.duration : set.weight}
                              onChangeText={(v) =>
                                updateSetField(
                                  we.id,
                                  idx,
                                  timed ? "duration" : "weight",
                                  v,
                                )
                              }
                              editable={!set.done}
                              keyboardType="numeric"
                              placeholder="– –"
                              placeholderTextColor="#49474D"
                              style={SET_FIELD_TEXT}
                              className={`flex-1 ${fieldClass}`}
                            />

                            {!timed && (
                              <TextInput
                                value={set.reps}
                                onChangeText={(v) =>
                                  updateSetField(we.id, idx, "reps", v)
                                }
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
                                onPress={() => toggleSetDone(we, idx)}
                                disabled={set.done}
                                className={`w-[22px] h-[22px] rounded-full items-center justify-center border-2 ${
                                  set.done
                                    ? "bg-secondary/20 border-secondary"
                                    : isActiveRow
                                      ? "border-outline active:border-primary"
                                      : "border-[#3A393E]"
                                }`}
                              >
                                {set.done && (
                                  <Check size={12} color="#B26CFF" />
                                )}
                              </Pressable>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Dots de paginação */}
      <View className="flex-row justify-center gap-1.5 pb-10">
        {exercises.map((we, i) => (
          <View
            key={we.id}
            className={`h-1.5 rounded-full ${
              i === current ? "w-5 bg-secondary" : "w-1.5 bg-surface-high"
            }`}
          />
        ))}
      </View>

      {/* Finalizar sempre disponível — pode-se pular exercícios sem concluir */}
      <View className="px-md pb-8">
        <Button
          label="Finalizar treino"
          size="md"
          fullWidth
          style={FINISH_SHADOW}
          loading={finishing}
          onPress={handleFinish}
        />
      </View>

      {/* Timer de descanso flutuante */}
      {rest != null && (
        <View
          className="absolute bottom-8 self-center bg-surface-high border border-secondary/40 rounded-2xl pl-3 pr-2.5 py-2.5 flex-row items-center gap-3"
          style={{
            left: 0,
            right: 0,
            marginHorizontal: "auto",
            maxWidth: 300,
            boxShadow: "0px 8px 28px rgba(0, 0, 0, 0.55)",
          }}
        >
          <LinearGradient
            colors={["#8113D3", "#6E00B3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 0.87 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0px 0px 14px rgba(129, 19, 211, 0.5)",
            }}
          >
            <Timer size={20} color="#FFF" />
          </LinearGradient>
          <View className="flex-1">
            <Text className="text-label-sm text-on-surface-variant uppercase tracking-widest font-bold">
              Descanso
            </Text>
            <Text className="text-title-md text-secondary font-bold leading-none mt-0.5">
              {fmtClock(rest)}
            </Text>
          </View>
          <Pressable
            onPress={() => setRest((r) => (r == null ? null : r + 15))}
            className="bg-surface-lowest w-9 h-9 rounded-xl items-center justify-center border border-secondary/25 active:opacity-70"
          >
            <Plus size={16} color="#B26CFF" strokeWidth={2.5} />
          </Pressable>
          <Pressable
            onPress={() => setRest(null)}
            className="bg-surface-lowest w-9 h-9 rounded-xl items-center justify-center border border-secondary/25 active:opacity-70"
          >
            <X size={16} color="#B26CFF" strokeWidth={2.5} />
          </Pressable>
        </View>
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
