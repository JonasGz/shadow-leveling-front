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
import {
  TriangleAlert,
  Inbox,
  Trophy,
  Dumbbell,
  Camera,
} from "lucide-react-native";
import { Button } from "../../../src/components/ui/Button";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { useToast } from "../../../src/components/ui/Toast";
import { sessionsService } from "../../../src/services/sessions.service";
import { workoutsService } from "../../../src/services/workouts.service";
import { pickImage } from "../../../src/lib/pickImage";
import type {
  ExerciseSet,
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
  isTimeOf: (id: string) => boolean,
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
    },
  );
  return { summaries, totalVolume };
}

export default function SessionCompleteScreen() {
  // A sessão já foi finalizada na tela de treino — aqui é só o resumo.
  // `xp` vem de lá (vazio quando o treino saiu como incompleto).
  const { id, workoutId, xp } = useLocalSearchParams<{
    id: string;
    workoutId?: string;
    xp?: string;
  }>();
  const { showToast } = useToast();

  const [session, setSession] = useState<WorkoutSessionDetail | null>(null);
  const [exerciseMeta, setExerciseMeta] = useState<
    Record<string, { name: string; isTime: boolean }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const earnedXp = xp ? Number(xp) : null;

  const load = useCallback(async () => {
    if (!id) return;
    setError(false);
    try {
      const s = await sessionsService.get(id);
      setSession(s);

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
    [exerciseMeta],
  );
  const isTimeOf = useCallback(
    (exId: string) => exerciseMeta[exId]?.isTime ?? false,
    [exerciseMeta],
  );

  const { summaries, totalVolume } = useMemo(
    () =>
      session
        ? buildSummary(session.sets ?? [], nameOf, isTimeOf)
        : { summaries: [], totalVolume: 0 },
    [session, nameOf, isTimeOf],
  );

  const hasSets = (session?.sets?.length ?? 0) > 0;

  // A foto é enviada assim que escolhida — cada envio sobrescreve a anterior
  // no backend (SetSessionPhoto), então trocar é só escolher outra.
  async function handlePickPhoto() {
    if (!session) return;
    const uri = await pickImage();
    if (!uri) return;

    setUploadingPhoto(true);
    try {
      await sessionsService.attachPhoto(session.id, uri);
      setPhotoUri(uri);
      showToast("Foto salva.", "success");
    } catch {
      showToast("Não foi possível enviar a foto.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleDone() {
    router.replace("/(tabs)");
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#c8a3ff" />
      </SafeAreaView>
    );
  }

  if (error || !session) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-lg gap-md">
        <EmptyState
          icon={TriangleAlert}
          title="Não foi possível carregar o resumo"
          description="O treino foi registrado, mas não conseguimos montar o resumo."
        />
        <Button
          label="Voltar"
          size="sm"
          onPress={() =>
            workoutId
              ? router.replace(`/workout/${workoutId}`)
              : router.replace("/(tabs)/workouts")
          }
        />
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
        <View className="items-center mb-lg">
          <LinearGradient
            colors={["#B26CFF", "#6E00B3"]}
            start={{ x: 0.32, y: 0.26 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0px 0px 22px rgba(159, 31, 255, 0.55)",
            }}
          >
            <Trophy size={28} color="#FFF" strokeWidth={1.7} />
          </LinearGradient>
          <Text className="text-title-xl text-secondary uppercase font-extrabold text-center mt-3">
            {hasSets ? "Treino Concluído!" : "Treino registrado"}
          </Text>
          <Text className="text-label-sm text-on-surface-variant uppercase tracking-widest text-center mt-2">
            {hasSets
              ? "Sessão finalizada com sucesso"
              : "Nenhuma série registrada nesta sessão"}
          </Text>
        </View>

        {/* XP ganho */}
        {hasSets && earnedXp != null ? (
          <LinearGradient
            colors={["#B26CFF", "#7A00C9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.87, y: 0.5 }} // ≈ 120deg
            style={{
              borderRadius: 22,
              padding: 14,
              alignItems: "center",
              boxShadow: "0px 8px 22px rgba(159, 31, 255, 0.4)",
            }}
          >
            <Text className="text-label-sm text-white/85 uppercase tracking-widest font-bold">
              XP Conquistado
            </Text>
            <View className="flex-row items-end gap-1 mt-2">
              <Text className="text-title-xxl text-white font-extrabold">
                +{earnedXp}
              </Text>
              <Text className="text-title-md text-white font-bold mb-0.5">
                XP
              </Text>
            </View>
          </LinearGradient>
        ) : null}

        {/* Foto do treino (opcional) — em destaque: é ela que vai para o grupo */}
        <Pressable
          onPress={handlePickPhoto}
          disabled={uploadingPhoto}
          className="rounded-2xl border border-dashed border-[#FFFFFF1F] bg-surface-low items-center justify-center overflow-hidden active:opacity-70 mt-md"
          style={{ height: 140 }}
        >
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <View className="items-center gap-2 px-md">
              <Camera size={26} color="#6C6971" strokeWidth={1.6} />
              <Text className="text-label-md text-on-surface-variant uppercase tracking-widest">
                Adicionar foto do treino
              </Text>
              <Text className="text-label-sm text-outline-variant text-center">
                Aparece para o seu grupo
              </Text>
            </View>
          )}
          {uploadingPhoto ? (
            <View className="absolute inset-0 bg-black/50 items-center justify-center">
              <ActivityIndicator color="#c8a3ff" />
            </View>
          ) : null}
        </Pressable>
        {photoUri && !uploadingPhoto ? (
          <Pressable onPress={handlePickPhoto} className="items-center mt-sm">
            <Text className="text-label-sm text-secondary uppercase tracking-widest">
              Trocar foto
            </Text>
          </Pressable>
        ) : null}

        {/* Stats */}
        <View className="flex-row gap-2.5 mt-md">
          <View className="flex-1 bg-surface-low border border-card-border border-l-[3px] border-l-primary rounded-xl p-md">
            <Text className="text-label-sm text-on-surface-variant uppercase tracking-widest">
              Volume total
            </Text>
            <View className="flex-row items-end gap-1 mt-2">
              <Text className="text-title-xl text-secondary font-extrabold">
                {totalVolume > 0 ? totalVolume.toLocaleString("pt-BR") : "—"}
              </Text>
              {totalVolume > 0 ? (
                <Text className="text-label-md text-outline-variant font-semibold mb-0.5">
                  kg
                </Text>
              ) : null}
            </View>
          </View>

          <View className="flex-1 bg-surface-low border border-card-border border-l-[3px] border-l-primary rounded-xl p-md">
            <Text className="text-label-sm text-on-surface-variant uppercase tracking-widest">
              Séries
            </Text>
            <View className="flex-row items-end gap-1 mt-2">
              <Text className="text-title-xl text-secondary font-extrabold">
                {session.sets?.length ?? 0}
              </Text>
              <Text className="text-label-md text-outline-variant font-semibold mb-0.5">
                total
              </Text>
            </View>
          </View>
        </View>

        {/* Resumo de performance */}
        <Text className="text-label-sm text-center text-secondary uppercase tracking-widest mt-lg mb-md font-bold">
          Resumo de performance
        </Text>

        {summaries.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nenhuma série registrada"
            description="Você finalizou sem registrar séries nesta sessão."
          />
        ) : (
          <View className="gap-sm">
            {summaries.map((ex) => (
              <View
                key={ex.exerciseId}
                className="bg-surface-low border border-card-border rounded-xl p-3.5"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-[38px] h-[38px] rounded-[9px] bg-surface-highest items-center justify-center">
                    <Dumbbell size={22} color="#B26CFF" strokeWidth={1.8} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-title-md text-white font-bold"
                      numberOfLines={1}
                    >
                      {ex.name}
                    </Text>
                    <Text className="text-label-md text-outline-variant mt-1">
                      {ex.setsCount}{" "}
                      {ex.setsCount === 1
                        ? "série realizada"
                        : "séries realizadas"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between border border-dashed border-[#FFFFFF1F] rounded-lg px-3 py-2.5 mt-3">
                  <Text className="text-label-sm text-secondary uppercase tracking-widest font-bold">
                    Melhor série
                  </Text>
                  {ex.isTime ? (
                    <Text className="text-title-md text-white font-extrabold">
                      {ex.bestDuration ?? 0}
                      <Text className="text-label-sm text-outline-variant font-semibold">
                        {" "}
                        s
                      </Text>
                    </Text>
                  ) : (
                    <View className="flex-row items-center gap-3">
                      <Text className="text-title-md text-white font-extrabold">
                        {ex.bestWeight ?? 0}
                        <Text className="text-label-sm text-outline-variant font-semibold">
                          {" "}
                          kg
                        </Text>
                      </Text>
                      <View className="w-px h-[18px] bg-[#FFFFFF1F]" />
                      <Text className="text-title-md text-white font-extrabold">
                        {ex.bestReps ?? 0}
                        <Text className="text-label-sm text-outline-variant font-semibold">
                          {" "}
                          reps
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Barra de ação fixa */}
      <View className="absolute bottom-0 left-0 right-0 p-md bg-surface-low border-t border-outline-variant">
        <Button
          label="Concluir"
          fullWidth
          disabled={uploadingPhoto}
          style={{ boxShadow: "0px 8px 22px rgba(159, 31, 255, 0.45)" }}
          onPress={handleDone}
        />
      </View>
    </SafeAreaView>
  );
}
