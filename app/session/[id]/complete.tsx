import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { useToast } from "../../../src/components/ui/Toast";
import { authService } from "../../../src/services/auth.service";
import { sessionsService } from "../../../src/services/sessions.service";
import { workoutsService } from "../../../src/services/workouts.service";
import { pickImage } from "../../../src/lib/pickImage";
import { useWorkoutsStore } from "../../../src/stores/workouts.store";
import type {
  ExerciseSet,
  SessionStatus,
  WorkoutSessionDetail,
} from "../../../src/types/api.types";

interface ExerciseSummary {
  exerciseId: string;
  name: string;
  isTime: boolean;
  setsCount: number;
  bestWeight: number | null;
  bestReps: number | null;
  bestDuration: number | null;
}

function buildSummary(
  sets: ExerciseSet[],
  nameOf: (id: string) => string,
  isTimeOf: (id: string) => boolean
): { summaries: ExerciseSummary[]; totalVolume: number } {
  const byEx: Record<string, ExerciseSet[]> = {};
  for (const s of sets) (byEx[s.exercise_id] ??= []).push(s);

  let totalVolume = 0;
  const summaries: ExerciseSummary[] = Object.entries(byEx).map(
    ([exId, list]) => {
      let best: ExerciseSet | null = null;
      let bestScore = -1;
      for (const s of list) {
        const vol = (s.weight ?? 0) * (s.reps ?? 0);
        totalVolume += vol;
        const score = s.duration != null ? s.duration : vol;
        if (score > bestScore) {
          bestScore = score;
          best = s;
        }
      }
      return {
        exerciseId: exId,
        name: nameOf(exId),
        isTime: isTimeOf(exId),
        setsCount: list.length,
        bestWeight: best?.weight ?? null,
        bestReps: best?.reps ?? null,
        bestDuration: best?.duration ?? null,
      };
    }
  );
  return { summaries, totalVolume };
}

export default function SessionCompleteScreen() {
  const { id, workoutId } = useLocalSearchParams<{
    id: string;
    workoutId?: string;
  }>();
  const { showToast } = useToast();
  const refreshWorkouts = useWorkoutsStore((s) => s.refresh);

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [exerciseMeta, setExerciseMeta] = useState<
    Record<string, { name: string; isTime: boolean }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<SessionStatus>("complete");
  const [submitting, setSubmitting] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  // XP previsto ao concluir (fórmula backend: 50 + min(streak * 5, 50))
  const [projectedXp, setProjectedXp] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(false);
    try {
      const s = await sessionsService.get(id);
      setSession(s);

      // XP previsto ao concluir: streak atual + fórmula do backend.
      try {
        const lvl = await authService.level();
        setProjectedXp(50 + Math.min(lvl.current_streak * 5, 50));
      } catch {
        // sem /me/level: usa o XP base (sem bônus de streak)
        setProjectedXp(50);
      }

      // Resolve nome/tipo de cada exercício pelo workout da sessão
      const wId = workoutId || s.workout_id;
      if (wId) {
        try {
          const w = await workoutsService.get(wId);
          const meta: Record<string, { name: string; isTime: boolean }> = {};
          for (const we of w.exercises ?? []) {
            meta[we.exercise_id] = {
              name: we.exercise.name,
              isTime: we.exercise.type === "time",
            };
          }
          setExerciseMeta(meta);
        } catch {
          // segue sem nomes; usa fallback
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id, workoutId]);

  useEffect(() => {
    load();
  }, [load]);

  const nameOf = useCallback(
    (exId: string) => exerciseMeta[exId]?.name ?? "Exercício",
    [exerciseMeta]
  );
  const isTimeOf = useCallback(
    (exId: string) => exerciseMeta[exId]?.isTime ?? false,
    [exerciseMeta]
  );

  const { summaries, totalVolume } = useMemo(
    () =>
      session
        ? buildSummary(session.sets ?? [], nameOf, isTimeOf)
        : { summaries: [], totalVolume: 0 },
    [session, nameOf, isTimeOf]
  );

  const hasSets = (session?.sets?.length ?? 0) > 0;

  // Sem séries registradas, "Completo" não é uma opção válida:
  // rebaixa a seleção para "Incompleto" automaticamente.
  useEffect(() => {
    if (session && !hasSets && status === "complete") {
      setStatus("incomplete");
    }
  }, [session, hasSets, status]);

  async function handleConfirm() {
    if (!session) return;

    // Sem nenhuma série registrada não há treino de fato — não pode
    // ser concluído como "complete" (evita XP indevido no backend).
    if (status === "complete" && !hasSets) {
      showToast(
        "Registre ao menos uma série para concluir como completo.",
        "warning"
      );
      return;
    }

    setSubmitting(true);
    try {
      await sessionsService.updateStatus(session.id, status);
      // Foto é opcional e não bloqueia a conclusão do treino.
      if (photoUri) {
        try {
          await sessionsService.attachPhoto(session.id, photoUri);
        } catch {
          showToast("Treino salvo, mas a foto falhou ao enviar.", "warning");
        }
      }
      await refreshWorkouts();

      // XP só é concedido pelo backend quando o status é "complete".
      if (status === "complete" && projectedXp != null) {
        showToast(`Treino finalizado!  +${projectedXp} XP`, "success");
      } else {
        showToast("Treino finalizado!", "success");
      }

      if (workoutId) router.replace(`/workout/${workoutId}`);
      else router.replace("/(tabs)/workouts");
    } catch {
      showToast("Erro ao finalizar o treino.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#d0bcff" />
      </SafeAreaView>
    );
  }

  if (error || !session) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-lg gap-md">
        <EmptyState
          icon="⚠️"
          title="Não foi possível carregar o resumo"
          description="O treino foi registrado, mas não conseguimos montar o resumo."
        />
        <Pressable
          onPress={() =>
            workoutId
              ? router.replace(`/workout/${workoutId}`)
              : router.replace("/(tabs)/workouts")
          }
          className="rounded bg-primary px-6 py-3 active:opacity-80"
        >
          <Text className="text-label-md uppercase tracking-widest text-on-primary font-semibold">
            Voltar
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-md py-lg pb-40"
        showsVerticalScrollIndicator={false}
      >
        {/* Header de celebração */}
        <View className="items-center mb-xl">
          <View
            className="w-20 h-20 mb-md rounded-full items-center justify-center border-2 border-primary overflow-hidden"
            style={{
              shadowColor: "#d0bcff",
              shadowOpacity: 0.4,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <LinearGradient
              colors={["#a078ff", "#6d3bd7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />
            <Text className="text-on-primary-container text-4xl">🏆</Text>
          </View>
          <Text className="text-display-md text-primary italic uppercase font-black tracking-tight text-center">
            Treino Concluído!
          </Text>
          <Text className="text-label-md text-on-surface-variant uppercase tracking-widest mt-1">
            Sessão finalizada com sucesso
          </Text>
        </View>

        {/* XP ganho — card destacado, largura total */}
        {status === "complete" && projectedXp != null ? (
          <View
            className="w-full rounded-xl border border-primary mb-md overflow-hidden"
            style={{
              shadowColor: "#d0bcff",
              shadowOpacity: 0.45,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <LinearGradient
              colors={["#a078ff", "#6d3bd7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />
            <View className="p-lg items-center">
              <Text className="text-label-sm text-on-primary-container uppercase tracking-widest mb-1">
                XP Conquistado
              </Text>
              <View className="flex-row items-end gap-1">
                <Text className="text-display-lg text-on-primary font-black">
                  +{projectedXp}
                </Text>
                <Text className="text-headline-mobile text-on-primary font-bold mb-2">
                  XP
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Stats */}
        <View className="flex-row gap-md mb-xl">
          <View className="flex-1 bg-surface-low p-lg rounded-xl border border-outline-variant overflow-hidden">
            <View className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            <Text className="text-label-sm text-on-surface-variant uppercase mb-2">
              Volume Total
            </Text>
            <View className="flex-row items-end gap-1">
              <Text className="text-display-md text-secondary">
                {totalVolume > 0
                  ? totalVolume.toLocaleString("pt-BR")
                  : "—"}
              </Text>
              {totalVolume > 0 ? (
                <Text className="text-title-md text-secondary mb-1.5">kg</Text>
              ) : null}
            </View>
          </View>

          <View className="flex-1 bg-surface-low p-lg rounded-xl border border-outline-variant overflow-hidden">
            <View className="absolute top-0 left-0 w-1 h-full bg-tertiary" />
            <Text className="text-label-sm text-on-surface-variant uppercase mb-2">
              Séries
            </Text>
            <View className="flex-row items-end gap-1">
              <Text className="text-display-md text-tertiary">
                {session.sets?.length ?? 0}
              </Text>
              <Text className="text-title-md text-tertiary mb-1.5">total</Text>
            </View>
          </View>
        </View>

        {/* Resumo de performance */}
        <Text className="text-label-md text-primary uppercase tracking-widest mb-md">
          Resumo de Performance
        </Text>

        {summaries.length === 0 ? (
          <View className="mb-xl">
            <EmptyState
              icon="📭"
              title="Nenhuma série registrada"
              description="Você finalizou sem registrar séries nesta sessão."
            />
          </View>
        ) : (
          <View className="gap-md mb-xl">
            {summaries.map((ex) => (
              <View
                key={ex.exerciseId}
                className="bg-surface-container p-md rounded-xl border border-outline-variant gap-md"
              >
                <View className="flex-row items-center gap-md">
                  <View className="w-12 h-12 rounded-lg bg-surface-high border border-outline-variant items-center justify-center">
                    <Text className="text-secondary text-xl">🏋</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-title-md text-on-surface uppercase">
                      {ex.name}
                    </Text>
                    <Text className="text-label-sm text-on-surface-variant">
                      {ex.setsCount}{" "}
                      {ex.setsCount === 1
                        ? "série realizada"
                        : "séries realizadas"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-md bg-surface-low p-sm rounded-lg border border-dashed border-outline-variant">
                  <Text className="text-label-sm text-secondary uppercase px-1">
                    Melhor Série
                  </Text>
                  {ex.isTime ? (
                    <View className="flex-1 items-end">
                      <Text className="text-title-md text-on-surface">
                        {ex.bestDuration ?? 0}
                        <Text className="text-label-sm"> s</Text>
                      </Text>
                      <Text className="text-label-sm text-on-surface-variant opacity-60">
                        Duração
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-1 flex-row items-center justify-end gap-md">
                      <View className="items-end">
                        <Text className="text-title-md text-on-surface">
                          {ex.bestWeight ?? 0}
                          <Text className="text-label-sm"> kg</Text>
                        </Text>
                        <Text className="text-label-sm text-on-surface-variant opacity-60">
                          Peso
                        </Text>
                      </View>
                      <View className="w-[1px] h-8 bg-outline-variant" />
                      <View className="items-end">
                        <Text className="text-title-md text-on-surface">
                          {ex.bestReps ?? 0}
                        </Text>
                        <Text className="text-label-sm text-on-surface-variant opacity-60">
                          Reps
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Foto do treino (opcional) */}
        <Text className="text-label-md text-on-surface-variant uppercase tracking-widest mb-md text-center">
          Foto do treino (opcional)
        </Text>
        <Pressable
          onPress={async () => {
            const uri = await pickImage();
            if (uri) setPhotoUri(uri);
          }}
          className="mb-xl rounded-xl border-2 border-dashed border-outline-variant bg-surface-container items-center justify-center overflow-hidden"
          style={{ height: 160 }}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={{ width: "100%", height: "100%" }} />
          ) : (
            <View className="items-center gap-1">
              <Text className="text-3xl">📸</Text>
              <Text className="text-label-sm text-on-surface-variant uppercase tracking-widest">
                Adicionar foto
              </Text>
            </View>
          )}
        </Pressable>
        {photoUri ? (
          <Pressable onPress={() => setPhotoUri(null)} className="items-center -mt-lg mb-xl">
            <Text className="text-label-sm text-error uppercase tracking-widest">
              Remover foto
            </Text>
          </Pressable>
        ) : null}

        {/* Seletor de status */}
        <Text className="text-label-md text-on-surface-variant uppercase tracking-widest mb-md text-center">
          Como você avalia este treino?
        </Text>
        <View className="flex-row gap-md">
          <Pressable
            onPress={() => setStatus("complete")}
            disabled={!hasSets}
            className={`flex-1 rounded-xl p-md items-center gap-1 border-2 ${
              status === "complete"
                ? "bg-surface-high border-primary"
                : "bg-surface-container border-outline-variant"
            } ${!hasSets ? "opacity-40" : ""}`}
            style={
              status === "complete"
                ? {
                    shadowColor: "#d0bcff",
                    shadowOpacity: 0.2,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 0 },
                  }
                : undefined
            }
          >
            <Text
              className={
                status === "complete" ? "text-primary text-2xl" : "text-on-surface-variant text-2xl"
              }
            >
              ✓
            </Text>
            <Text
              className={`text-label-sm uppercase ${
                status === "complete"
                  ? "text-primary"
                  : "text-on-surface-variant"
              }`}
            >
              Completo
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setStatus("incomplete")}
            className={`flex-1 rounded-xl p-md items-center gap-1 border-2 ${
              status === "incomplete"
                ? "bg-surface-high border-tertiary"
                : "bg-surface-container border-outline-variant"
            }`}
          >
            <Text
              className={
                status === "incomplete"
                  ? "text-tertiary text-2xl"
                  : "text-on-surface-variant text-2xl"
              }
            >
              ⚠
            </Text>
            <Text
              className={`text-label-sm uppercase ${
                status === "incomplete"
                  ? "text-tertiary"
                  : "text-on-surface-variant"
              }`}
            >
              Incompleto
            </Text>
          </Pressable>
        </View>

        {!hasSets ? (
          <Text className="text-label-sm text-on-surface-variant text-center mt-md px-lg">
            Nenhuma série registrada — registre ao menos uma para concluir
            como completo e ganhar XP.
          </Text>
        ) : null}
      </ScrollView>

      {/* Barra de ação fixa */}
      <View className="absolute bottom-0 left-0 right-0 p-md bg-surface-low border-t border-outline-variant">
        <Pressable
          onPress={handleConfirm}
          disabled={submitting}
          className="w-full bg-primary py-lg rounded-xl items-center justify-center active:opacity-90"
          style={{
            shadowColor: "#d0bcff",
            shadowOpacity: 0.3,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#3c0091" />
          ) : (
            <Text className="text-on-primary text-title-md uppercase tracking-tight font-bold">
              Finalizar treino
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}