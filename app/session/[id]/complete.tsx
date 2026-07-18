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
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Inbox from "lucide-react-native/icons/inbox";
import Trophy from "lucide-react-native/icons/trophy";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import Camera from "lucide-react-native/icons/camera";
import { Button } from "../../../src/components/ui/Button";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { useToast } from "../../../src/components/ui/Toast";
import { sessionsService } from "../../../src/services/sessions.service";
import { workoutsService } from "../../../src/services/workouts.service";
import { pickImage } from "../../../src/lib/pickImage";
import { buildSessionSummary } from "../../../src/features/sets";
import type { WorkoutSessionDetail } from "../../../src/types/api.types";
import { color } from "../../../src/theme/palette";

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
        ? buildSessionSummary(session.sets ?? [], nameOf, isTimeOf)
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
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-700">
        <ActivityIndicator size="large" color={color["purple-100"]} />
      </SafeAreaView>
    );
  }

  if (error || !session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-gray-700 px-6">
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
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-4 py-6 pb-40"
        showsVerticalScrollIndicator={false}
      >
        {/* Header de celebração */}
        <View className="mb-6 items-center">
          <LinearGradient
            colors={[color["purple-200"], color["purple-400"]]}
            start={{ x: 0.32, y: 0.26 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 54,
              height: 54,
              borderRadius: 9999, // circulo: 54x54
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0px 0px 22px rgba(129, 19, 211, 0.55)",
            }}
          >
            <Trophy size={28} color={color.white} strokeWidth={1.7} />
          </LinearGradient>
          <Text className="mt-3 text-center text-title-xl font-extrabold uppercase text-purple-200">
            {hasSets ? "Treino Concluído!" : "Treino registrado"}
          </Text>
          <Text className="mt-2 text-center text-label-sm uppercase tracking-widest text-gray-200">
            {hasSets
              ? "Sessão finalizada com sucesso"
              : "Nenhuma série registrada nesta sessão"}
          </Text>
        </View>

        {/* XP ganho */}
        {hasSets && earnedXp != null ? (
          <LinearGradient
            colors={[color["purple-200"], color["purple-400"]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.87, y: 0.5 }} // ≈ 120deg
            style={{
              borderRadius: 28, // rounded-2xl (container)
              padding: 14,
              alignItems: "center",
              boxShadow: "0px 8px 22px rgba(129, 19, 211, 0.4)",
            }}
          >
            <Text className="text-label-sm font-bold uppercase tracking-widest text-white/85">
              XP Conquistado
            </Text>
            <View className="mt-2 flex-row items-end gap-1">
              <Text className="text-title-xxl font-extrabold text-white">
                +{earnedXp}
              </Text>
              <Text className="mb-1 text-title-md font-bold text-white">
                XP
              </Text>
            </View>
          </LinearGradient>
        ) : null}

        {/* Foto do treino (opcional) — em destaque: é ela que vai para o grupo */}
        <Pressable
          onPress={handlePickPhoto}
          disabled={uploadingPhoto}
          className="mt-4 h-[140px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/12 bg-gray-600 active:opacity-70"
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} className="h-full w-full" />
          ) : (
            <View className="items-center gap-2 px-4">
              <Camera size={26} color={color["gray-300"]} strokeWidth={1.6} />
              <Text className="text-label-md uppercase tracking-widest text-gray-200">
                Adicionar foto do treino
              </Text>
              <Text className="text-center text-label-sm text-gray-300">
                Aparece para o seu grupo
              </Text>
            </View>
          )}
          {uploadingPhoto ? (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <ActivityIndicator color={color["purple-100"]} />
            </View>
          ) : null}
        </Pressable>
        {photoUri && !uploadingPhoto ? (
          <Pressable onPress={handlePickPhoto} className="mt-2 items-center">
            <Text className="text-label-sm uppercase tracking-widest text-purple-200">
              Trocar foto
            </Text>
          </Pressable>
        ) : null}

        {/* Stats */}
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-l-[3px] border-white/7 border-l-purple-300 bg-gray-600 p-4">
            <Text className="text-label-sm uppercase tracking-widest text-gray-200">
              Volume total
            </Text>
            <View className="mt-2 flex-row items-end gap-1">
              <Text className="text-title-xl font-extrabold text-purple-200">
                {totalVolume > 0 ? totalVolume.toLocaleString("pt-BR") : "—"}
              </Text>
              {totalVolume > 0 ? (
                <Text className="mb-1 text-label-md font-semibold text-gray-300">
                  kg
                </Text>
              ) : null}
            </View>
          </View>

          <View className="flex-1 rounded-2xl border border-l-[3px] border-white/7 border-l-purple-300 bg-gray-600 p-4">
            <Text className="text-label-sm uppercase tracking-widest text-gray-200">
              Séries
            </Text>
            <View className="mt-2 flex-row items-end gap-1">
              <Text className="text-title-xl font-extrabold text-purple-200">
                {session.sets?.length ?? 0}
              </Text>
              <Text className="mb-1 text-label-md font-semibold text-gray-300">
                total
              </Text>
            </View>
          </View>
        </View>

        {/* Resumo de performance */}
        <Text className="mb-4 mt-6 text-center text-label-sm font-bold uppercase tracking-widest text-purple-200">
          Resumo de performance
        </Text>

        {summaries.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nenhuma série registrada"
            description="Você finalizou sem registrar séries nesta sessão."
          />
        ) : (
          <View className="gap-2">
            {summaries.map((ex) => (
              <View
                key={ex.exerciseId}
                className="rounded-2xl border border-white/7 bg-gray-600 p-4"
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-[38px] w-[38px] items-center justify-center rounded-lg bg-gray-500">
                    <Dumbbell
                      size={22}
                      color={color["purple-200"]}
                      strokeWidth={1.8}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-title-md font-bold text-white"
                      numberOfLines={1}
                    >
                      {ex.name}
                    </Text>
                    <Text className="mt-1 text-label-md text-gray-300">
                      {ex.setsCount}{" "}
                      {ex.setsCount === 1
                        ? "série realizada"
                        : "séries realizadas"}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-lg border border-dashed border-white/12 px-3 py-3">
                  <Text className="text-label-sm font-bold uppercase tracking-widest text-purple-200">
                    Melhor série
                  </Text>
                  {ex.isTime ? (
                    <Text className="text-title-md font-extrabold text-white">
                      {ex.bestDuration ?? 0}
                      <Text className="text-label-sm font-semibold text-gray-300">
                        {" "}
                        s
                      </Text>
                    </Text>
                  ) : (
                    <View className="flex-row items-center gap-3">
                      <Text className="text-title-md font-extrabold text-white">
                        {ex.bestWeight ?? 0}
                        <Text className="text-label-sm font-semibold text-gray-300">
                          {" "}
                          kg
                        </Text>
                      </Text>
                      <View className="h-[18px] w-px bg-white/12" />
                      <Text className="text-title-md font-extrabold text-white">
                        {ex.bestReps ?? 0}
                        <Text className="text-label-sm font-semibold text-gray-300">
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
      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-300 bg-gray-600 p-4">
        <Button
          label="Concluir"
          fullWidth
          disabled={uploadingPhoto}
          style={{ boxShadow: "0px 8px 22px rgba(129, 19, 211, 0.45)" }}
          onPress={handleDone}
        />
      </View>
    </SafeAreaView>
  );
}
