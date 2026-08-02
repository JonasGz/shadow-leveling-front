import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Dumbbell from "lucide-react-native/icons/dumbbell";
import ArrowLeftRight from "lucide-react-native/icons/arrow-left-right";
import { exercisesService } from "../services/exercises.service";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import type { Exercise } from "../types/api.types";
import { color } from "../theme/palette";
import { Card } from "./ui/Card";
import { SearchInput } from "./ui/SearchInput";

interface SubstituteExerciseModalProps {
  visible: boolean;
  origin: Exercise | null;
  onSelect: (substitute: Exercise) => void;
  onClose: () => void;
}

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
          className="max-h-[85%] rounded-t-2xl border-t border-white/7 bg-gray-600 pb-10"
        >
          <View className="px-6 pb-4 pt-6">
            <View className="mb-1 flex-row items-center gap-2">
              <ArrowLeftRight size={18} color={color["purple-100"]} />
              <Text className="text-xl font-bold text-white">
                Trocar exercício
              </Text>
            </View>
            <Text className="text-xs font-normal text-gray-200">
              {origin
                ? `Máquina ocupada? Substitua "${origin.name}" por hoje.`
                : "Substituir o exercício atual por esta sessão."}
            </Text>
          </View>

          <View className="px-6 pb-4">
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar outro exercício..."
              size="md"
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-6 pb-4"
          >
            {search.trim().length < 2 && (
              <View className="mb-4">
                <Text className="mb-2 text-xs font-bold uppercase text-gray-200">
                  Sugestões
                </Text>
                {loadingSuggestions ? (
                  <View className="items-center py-6">
                    <ActivityIndicator
                      size="small"
                      color={color["purple-100"]}
                    />
                  </View>
                ) : suggestions.length === 0 ? (
                  <Text className="text-xs font-medium text-gray-200">
                    Nenhuma sugestão automática. Use a busca acima.
                  </Text>
                ) : (
                  suggestions.map((ex) => (
                    <SubstituteRow key={ex.id} exercise={ex} onPick={pick} />
                  ))
                )}
              </View>
            )}

            {search.trim().length >= 2 && (
              <View>
                {searching ? (
                  <View className="items-center py-6">
                    <ActivityIndicator
                      size="small"
                      color={color["purple-100"]}
                    />
                  </View>
                ) : searchResults.length === 0 ? (
                  <Text className="text-xs font-medium text-gray-200">
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
    <Card
      onPress={() => onPick(exercise)}
      className="mb-2 flex-row items-center gap-3 border-white/12"
    >
      <View className="h-10 w-10 items-center justify-center rounded-lg bg-purple-300/20">
        <Dumbbell size={18} color={color["purple-100"]} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-white" numberOfLines={2}>
          {exercise.name}
        </Text>
        {(muscles.length > 0 || chips.length > 0) && (
          <Text
            className="mt-1 text-xs font-medium text-gray-200"
            numberOfLines={1}
          >
            {[...chips, ...muscles].join(" · ")}
          </Text>
        )}
      </View>
    </Card>
  );
}
