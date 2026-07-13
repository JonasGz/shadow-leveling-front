import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Input } from "../../../src/components/ui/Input";
import { Button } from "../../../src/components/ui/Button";
import { Search, ChevronLeft } from "lucide-react-native";
import { SearchInput } from "../../../src/components/ui/SearchInput";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { useToast } from "../../../src/components/ui/Toast";
import { exercisesService } from "../../../src/services/exercises.service";
import { workoutsService } from "../../../src/services/workouts.service";
import { useWorkoutsStore } from "../../../src/stores/workouts.store";
import type { Exercise, ExerciseType } from "../../../src/types/api.types";

type Stage = "search" | "configure";

export default function AddExerciseScreen() {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const refreshWorkouts = useWorkoutsStore((s) => s.refresh);

  const [stage, setStage] = useState<Stage>("search");

  // --- Busca ---
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (search: string) => {
      setSearching(true);
      try {
        const res = await exercisesService.list({ search, limit: 20 });
        setResults(res.data);
        setCursor(res.cursor.next_cursor);
        setHasMore(res.cursor.has_more);
      } catch {
        showToast("Erro ao buscar exercícios.", "error");
      } finally {
        setSearching(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query.trim()), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await exercisesService.list({
        search: query.trim(),
        cursor,
        limit: 20,
      });
      setResults((prev) => [...prev, ...res.data]);
      setCursor(res.cursor.next_cursor);
      setHasMore(res.cursor.has_more);
    } catch {
      showToast("Erro ao carregar mais.", "error");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, cursor, query, showToast]);

  // --- Exercício selecionado / criado ---
  const [selected, setSelected] = useState<Exercise | null>(null);

  function selectExercise(ex: Exercise) {
    setSelected(ex);
    setStage("configure");
  }

  async function createAndSelect(type: ExerciseType) {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    try {
      const ex = await exercisesService.create({
        name,
        type,
        unit: type === "time" ? "seconds" : "reps",
      });
      showToast(`Exercício "${ex.name}" criado.`, "success");
      selectExercise(ex);
    } catch (err: any) {
      showToast(
        err?.response?.status === 400
          ? "Dados inválidos para criar exercício."
          : "Erro ao criar exercício.",
        "error",
      );
    } finally {
      setCreating(false);
    }
  }

  // --- Configuração (séries/reps/duração/nota) ---
  const [sets, setSets] = useState("3");
  const [repsMin, setRepsMin] = useState("8");
  const [repsMax, setRepsMax] = useState("12");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const isTimeBased = selected?.type === "time";

  async function handleAdd() {
    if (!selected || !workoutId) return;
    const setsNum = parseInt(sets, 10);
    if (!setsNum || setsNum < 1) {
      showToast("Informe ao menos 1 série.", "error");
      return;
    }

    setSaving(true);
    try {
      await workoutsService.addExercise(workoutId, {
        exercise_id: selected.id,
        sets: setsNum,
        reps_min: isTimeBased ? null : repsMin ? parseInt(repsMin, 10) : null,
        reps_max: isTimeBased ? null : repsMax ? parseInt(repsMax, 10) : null,
        duration: isTimeBased && duration ? parseInt(duration, 10) : null,
        note: note.trim(),
        sort_order: 0,
      });
      await refreshWorkouts();
      showToast("Exercício adicionado ao treino.", "success");
      router.back();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) showToast("Dados inválidos.", "error");
      else if (status === 404) showToast("Treino não encontrado.", "error");
      else showToast("Erro ao adicionar exercício.", "error");
    } finally {
      setSaving(false);
    }
  }

  const showCreateOption =
    query.trim().length > 0 &&
    !searching &&
    !results.some((e) => e.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Top App Bar (mesma da tela de workout) */}
      <View className="flex-row justify-between items-center px-md h-16">
        <Pressable
          onPress={() =>
            stage === "configure" ? setStage("search") : router.back()
          }
          hitSlop={8}
          className="active:opacity-60"
        >
          <ChevronLeft size={22} color="#DCDCDD" />
        </Pressable>
        <Text className="text-title-lg text-white font-bold">
          {stage === "search" ? "Adicionar exercício" : "Configurar"}
        </Text>
        {/* espaçador para manter o título centralizado */}
        <View className="w-[22px]" />
      </View>

      {stage === "search" ? (
        <View className="flex-1 px-md">
          <View className="py-sm">
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar exercício..."
              autoFocus
              autoCorrect={false}
            />
          </View>

          {searching && results.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#c8a3ff" />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-xl gap-sm pt-5"
              onEndReached={loadMore}
              onEndReachedThreshold={0.4}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => selectExercise(item)}
                  className="bg-surface-low border border-card-border rounded-xl text-on-surface-variant px-md py-md flex-row items-center justify-between active:opacity-80"
                >
                  <View className="flex-1">
                    <Text className="text-body-lg font-semibold text-on-surface">
                      {item.name}
                    </Text>
                  </View>
                  <Text className="text-secondary text-title-lg">+</Text>
                </Pressable>
              )}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator color="#c8a3ff" className="py-md" />
                ) : null
              }
              ListEmptyComponent={
                !searching ? (
                  <View className="mt-xl">
                    <EmptyState
                      icon={Search}
                      title="Nenhum exercício encontrado"
                      description={
                        query.trim()
                          ? "Crie um novo exercício abaixo."
                          : "Digite para buscar no catálogo."
                      }
                    />
                  </View>
                ) : null
              }
            />
          )}

          {showCreateOption && (
            <View className="py-sm gap-sm pb-10">
              <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant text-center">
                {`Criar "${query.trim()}" como:`}
              </Text>
              <View className="flex-row gap-sm">
                <View className="flex-1">
                  <Button
                    label="Repetições"
                    variant="tonal"
                    loading={creating}
                    onPress={() => createAndSelect("repetition")}
                    fullWidth
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Tempo"
                    variant="tonal"
                    loading={creating}
                    onPress={() => createAndSelect("time")}
                    fullWidth
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-start"
        >
          <View className="flex-1 px-md gap-md">
            <View className="bg-surface-low border border-card-border rounded-2xl p-md px-lg">
              <Text className="text-title-md text-on-surface font-semibold">
                {selected?.name}
              </Text>
              <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant mt-1">
                {isTimeBased ? "Baseado em tempo" : "Baseado em repetições"} ·{" "}
                {selected?.unit}
              </Text>
            </View>

            <Input
              label="Séries"
              centeredLabel
              labelSize="md"
              value={sets}
              onChangeText={setSets}
              keyboardType="number-pad"
              placeholder="3"
            />

            {isTimeBased ? (
              <Input
                label="Duração (segundos)"
                centeredLabel
                labelSize="md"
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholder="60"
              />
            ) : (
              <View className="flex-row gap-md">
                <View className="flex-1">
                  <Input
                    label="Reps mín."
                    centeredLabel
                    labelSize="md"
                    value={repsMin}
                    onChangeText={setRepsMin}
                    keyboardType="number-pad"
                    placeholder="8"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="Reps máx."
                    centeredLabel
                    labelSize="md"
                    value={repsMax}
                    onChangeText={setRepsMax}
                    keyboardType="number-pad"
                    placeholder="12"
                  />
                </View>
              </View>
            )}

            <Input
              label="Observação (opcional)"
              centeredLabel
              labelSize="md"
              value={note}
              onChangeText={setNote}
              placeholder="Ex: pegada aberta, descida lenta"
              multiline
            />
          </View>

          <View className="px-md pb-10">
            <Button
              label="Adicionar ao treino"
              onPress={handleAdd}
              loading={saving}
              fullWidth
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
