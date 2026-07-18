import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../stores/auth.store";
import { useToast } from "./ui/Toast";
import type { User } from "../types/api.types";
import { color } from "../theme/palette";
import { cn } from "../lib/cn";

interface WeeklyGoalModalProps {
  visible: boolean;
  /** Dismisses the modal. Omitted when the user must define a goal. */
  onClose?: () => void;
  /** Called with the updated user after a successful save. */
  onSaved?: (user: User) => void;
  /** Force the user to define a goal: hides the "depois" escape hatch. */
  required?: boolean;
}

export function WeeklyGoalModal({
  visible,
  onClose,
  onSaved,
  required = false,
}: WeeklyGoalModalProps) {
  const { showToast } = useToast();
  const setUser = useAuthStore((s) => s.setUser);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setValue("");
  }, [visible]);

  const parsed = Number.parseInt(value, 10);
  const isValid = Number.isInteger(parsed) && parsed >= 1;

  async function save() {
    if (!isValid) {
      showToast("Informe um número maior que zero.", "warning");
      return;
    }
    setSaving(true);
    try {
      const user = await authService.updateWeeklyGoal(parsed);
      setUser(user);
      onSaved?.(user);
      showToast("Meta semanal definida.", "success");
      onClose?.();
    } catch {
      showToast("Não foi possível salvar a meta.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={required ? undefined : onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center bg-black/70 px-6"
      >
        <View className="w-full gap-4 rounded-2xl border border-gray-300 bg-gray-600 p-6">
          <Text className="text-title-md font-bold text-white">
            Meta semanal
          </Text>
          <Text className="text-label-sm text-gray-200">
            Quantos treinos você quer fazer por semana?
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="ex: 5"
            placeholderTextColor={color["gray-200"]}
            keyboardType="number-pad"
            autoFocus
            className="rounded-lg border border-white/12 bg-gray-600 px-4 py-3 text-body-lg text-white"
          />
          <View className="mt-2 flex-row gap-4">
            {!required && (
              <Pressable
                onPress={onClose}
                disabled={saving}
                className="flex-1 items-center rounded-lg border border-gray-300 py-3 active:opacity-70"
              >
                <Text className="text-label-md uppercase text-gray-200">
                  Depois
                </Text>
              </Pressable>
            )}
            <View className={required ? "w-full" : "flex-1"}>
              <Pressable
                onPress={save}
                disabled={saving || !isValid}
                className={cn(
                  "items-center rounded-lg py-3 active:opacity-80",
                  isValid ? "bg-purple-300" : "bg-purple-300/40",
                )}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={color.white} />
                ) : (
                  <Text className="text-label-md font-semibold uppercase text-gray-50">
                    Confirmar
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
