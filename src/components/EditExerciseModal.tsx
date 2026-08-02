import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Input } from "./ui/Input";
import { useToast } from "./ui/Toast";
import { workoutsService } from "../services/workouts.service";
import type { WorkoutExercise } from "../types/api.types";
import { color } from "../theme/palette";
import { cn } from "../lib/cn";

interface EditExerciseModalProps {
  item: WorkoutExercise | null;
  workoutId: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

export function EditExerciseModal({
  item,
  workoutId,
  onClose,
  onSaved,
}: EditExerciseModalProps) {
  const { showToast } = useToast();
  const [sets, setSets] = useState("");
  const [repsMin, setRepsMin] = useState("");
  const [repsMax, setRepsMax] = useState("");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setSets(String(item.sets ?? ""));
    setRepsMin(item.reps_min != null ? String(item.reps_min) : "");
    setRepsMax(item.reps_max != null ? String(item.reps_max) : "");
    setDuration(item.duration != null ? String(item.duration) : "");
    setNote(item.note ?? "");
  }, [item]);

  const isTimeBased = item?.exercise.type === "time";
  const setsNum = Number.parseInt(sets, 10);
  const isValid = Number.isInteger(setsNum) && setsNum >= 1;

  async function save() {
    if (!item || !isValid) {
      showToast("Informe ao menos 1 série.", "error");
      return;
    }
    setSaving(true);
    try {
      await workoutsService.updateExercise(workoutId, item.id, {
        sets: setsNum,
        reps_min: isTimeBased ? null : repsMin ? parseInt(repsMin, 10) : null,
        reps_max: isTimeBased ? null : repsMax ? parseInt(repsMax, 10) : null,
        duration: isTimeBased && duration ? parseInt(duration, 10) : null,
        note: note.trim(),
      });
      await onSaved();
      showToast("Exercício atualizado.", "success");
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) showToast("Dados inválidos.", "error");
      else if (status === 404) showToast("Exercício não encontrado.", "error");
      else showToast("Não foi possível salvar.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center bg-black/70 px-6"
      >
        <View className="w-full gap-4 rounded-2xl border border-white/7 bg-gray-600 p-6">
          <View>
            <Text className="text-xl font-bold text-white" numberOfLines={1}>
              {item?.exercise.name}
            </Text>
            <Text className="mt-1 text-xs font-medium uppercase text-gray-200">
              {isTimeBased ? "Baseado em tempo" : "Baseado em repetições"}
            </Text>
          </View>

          <Input
            label="Séries"
            value={sets}
            onChangeText={setSets}
            keyboardType="number-pad"
            placeholder="3"
          />

          {isTimeBased ? (
            <Input
              label="Duração (segundos)"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="60"
            />
          ) : (
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Input
                  label="Reps mín."
                  value={repsMin}
                  onChangeText={setRepsMin}
                  keyboardType="number-pad"
                  placeholder="8"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Reps máx."
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
            value={note}
            onChangeText={setNote}
            placeholder="Ex: pegada aberta, descida lenta"
            multiline
          />

          <View className="mt-2 flex-row gap-4">
            <Pressable
              onPress={onClose}
              disabled={saving}
              className="flex-1 items-center rounded-lg border border-gray-300 py-3 active:opacity-70"
            >
              <Text className="text-base font-semibold uppercase text-gray-200">
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving || !isValid}
              className={cn(
                "flex-1 items-center rounded-lg py-3 active:opacity-80",
                isValid ? "bg-purple-300" : "bg-purple-300/40",
              )}
            >
              {saving ? (
                <ActivityIndicator size="small" color={color.white} />
              ) : (
                <Text className="text-base font-semibold uppercase text-gray-50">
                  Salvar
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
