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
        className="flex-1 bg-black/70 items-center justify-center px-lg"
      >
        <View className="w-full bg-surface-container border border-outline-variant rounded-xl p-lg gap-md">
          <Text className="text-title-md text-on-surface font-bold">
            Meta semanal
          </Text>
          <Text className="text-label-sm text-on-surface-variant">
            Quantos treinos você quer fazer por semana?
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="ex: 5"
            placeholderTextColor="#958ea0"
            keyboardType="number-pad"
            autoFocus
            className="bg-surface-low border border-[#FFFFFF1F] rounded-xl px-md py-3 text-on-surface text-body-lg"
          />
          <View className="flex-row gap-md mt-sm">
            {!required && (
              <Pressable
                onPress={onClose}
                disabled={saving}
                className="flex-1 rounded-lg border border-outline-variant py-3 items-center active:opacity-70"
              >
                <Text className="text-on-surface-variant text-label-md uppercase">
                  Depois
                </Text>
              </Pressable>
            )}
            <View className={required ? "w-full" : "flex-1"}>
              <Pressable
                onPress={save}
                disabled={saving || !isValid}
                className={`rounded-lg py-3 items-center active:opacity-80 ${
                  isValid ? "bg-primary" : "bg-primary/40"
                }`}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-on-primary text-label-md font-semibold uppercase">
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
