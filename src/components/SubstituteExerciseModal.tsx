import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import Search from "lucide-react-native/icons/search";
import ArrowLeftRight from "lucide-react-native/icons/arrow-left-right";
import { exercisesService } from "../services/exercises.service";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import type { Exercise } from "../types/api.types";
import { color } from "../theme/palette";

interface SubstituteExerciseModalProps {
  visible: boolean;
  /** The exercise currently being performed (the one whose machine is busy). */
  origin: Exercise | null;
  /** Called when the user picks a substitute. The session screen plays it as a
   * local, in-session swap — nothing is persisted server-side until a set is
   * recorded against the substitute's exercise_id. */
  onSelect: (substitute: Exercise) => void;
  onClose: () => void;
}

// Two source lists side-by-side: ranked suggestions (3) from
// /exercises/{id}/substitutes and a manual search box backed by the existing
// /exercises?q= endpoint. The "máquina ocupada" button opens the modal; the
// user taps any row and the active exercise is swapped for this session only.
export function SubstituteExerciseModal({
  visible,
  origin,
  onSelect,
  onClose,
}: SubstituteExerciseModalProps) {
  const [suggestions, setSuggestions] = useState<Exercise[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);

  const { searching } = useDebouncedSearch(
    search,
    async (query, isCurrent) => {
      try {
        const res = await exercisesService.list({ search: query, limit: 20 });
        if (isCurrent()) setSearchResults(res.data);
      } catch {
        if (isCurrent()) setSearchResults([]);
      }
    },
    {
      enabled: visible,
      minLength: 2,
      onSkip: () => setSearchResults([]),
    },
  );

  const loadSuggestions = useCallback(async () => {
    if (!origin) return;
    setLoadingSuggestions(true);
    try {
      const res = await exercisesService.substitutes(origin.id, { limit: 3 });
      setSuggestions(res.data);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [origin]);

  useEffect(() => {
    if (visible) {
      setSearch("");
      setSearchResults([]);
      loadSuggestions();
    }
  }, [visible, loadSuggestions]);

  function pick(ex: Exercise) {
    onSelect(ex);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/70" onPress={onClose}>
        <Pressable
          onPress={() => {}}
          className="max-h-[85%] rounded-t-2xl border-t border-gray-300 bg-gray-600 pb-xl"
        >
          {/* Header */}
          <View className="px-lg pb-md pt-lg">
            <View className="mb-1 flex-row items-center gap-2">
              <ArrowLeftRight size={18} color={color["purple-100"]} />
              <Text className="text-title-md font-bold text-white">
                Trocar exercício
              </Text>
            </View>
            <Text className="text-label-sm text-gray-200">
              {origin
                ? `Máquina ocupada? Substitua "${origin.name}" por hoje.`
                : "Substituir o exercício atual por esta sessão."}
            </Text>
          </View>

          {/* Manual search */}
          <View className="px-lg pb-md">
            <View className="flex-row items-center gap-2 rounded-xl border border-white/12 bg-gray-600 px-md py-3">
              <Search size={16} color={color["gray-200"]} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar outro exercício..."
                placeholderTextColor={color["gray-200"]}
                className="flex-1 text-body-md text-white"
              />
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-lg pb-md"
          >
            {/* Suggested substitutes (only when no active search) */}
            {search.trim().length < 2 && (
              <View className="mb-md">
                <Text className="mb-2 text-label-sm font-bold uppercase tracking-widest text-gray-200">
                  Sugestões
                </Text>
                {loadingSuggestions ? (
                  <View className="items-center py-lg">
                    <ActivityIndicator
                      size="small"
                      color={color["purple-100"]}
                    />
                  </View>
                ) : suggestions.length === 0 ? (
                  <Text className="text-label-sm text-gray-200">
                    Nenhuma sugestão automática. Use a busca acima.
                  </Text>
                ) : (
                  suggestions.map((ex) => (
                    <SubstituteRow key={ex.id} exercise={ex} onPick={pick} />
                  ))
                )}
              </View>
            )}

            {/* Manual search results */}
            {search.trim().length >= 2 && (
              <View>
                {searching ? (
                  <View className="items-center py-lg">
                    <ActivityIndicator
                      size="small"
                      color={color["purple-100"]}
                    />
                  </View>
                ) : searchResults.length === 0 ? (
                  <Text className="text-label-sm text-gray-200">
                    Nenhum exercício encontrado.
                  </Text>
                ) : (
                  searchResults.map((ex) => (
                    <SubstituteRow key={ex.id} exercise={ex} onPick={pick} />
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SubstituteRow({
  exercise,
  onPick,
}: {
  exercise: Exercise;
  onPick: (e: Exercise) => void;
}) {
  // Display layer: prefer PT translations, fallback to EN when untranslated or
  // user-created. Display-only — the ranking query runs against EN columns.
  const equipment = exercise.equipment_pt ?? exercise.equipment ?? null;
  const mechanic = exercise.mechanic_pt ?? exercise.mechanic ?? null;
  const muscles = (
    exercise.primary_muscles_pt ??
    exercise.primary_muscles ??
    []
  ).slice(0, 3);

  const chips: string[] = [];
  if (equipment) chips.push(equipment);
  if (mechanic) chips.push(mechanic);

  return (
    <Pressable
      onPress={() => onPick(exercise)}
      className="mb-2 flex-row items-center gap-3 rounded-xl border border-white/12 bg-gray-600 p-md active:opacity-70"
    >
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-purple-300/20">
        <Dumbbell size={18} color={color["purple-100"]} />
      </View>
      <View className="flex-1">
        <Text
          className="text-body-md font-semibold text-white"
          numberOfLines={2}
        >
          {exercise.name}
        </Text>
        {(muscles.length > 0 || chips.length > 0) && (
          <Text className="mt-1 text-label-sm text-gray-200" numberOfLines={1}>
            {[...chips, ...muscles].join(" · ")}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
