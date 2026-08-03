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
import { authService } from "../services/auth.service";
import { useAuthStore } from "../stores/auth.store";
import { useToast } from "./ui/Toast";
import type { User } from "../types/api.types";
import { color } from "../theme/palette";
import { cn } from "../lib/cn";

interface WeeklyGoalModalProps {
  visible: boolean;
  onClose?: () => void;
  onSaved?: (user: User) => void;
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
        <View className="w-full gap-4 rounded-2xl border border-white/7 bg-gray-600 p-6">
          <Text className="text-xl font-bold text-white">Meta semanal</Text>
          <Text className="text-xs font-medium text-gray-200">
            Quantos treinos você quer fazer por semana?
          </Text>
          <Input
            value={value}
            onChangeText={setValue}
            placeholder="ex: 5"
            keyboardType="number-pad"
            autoFocus
            size="md"
          />
          <View className="mt-2 flex-row gap-4">
            {!required && (
              <Pressable
                onPress={onClose}
                disabled={saving}
                className="flex-1 items-center rounded-lg border border-gray-300 py-3 active:opacity-70"
              >
                <Text className="text-base font-semibold uppercase text-gray-200">
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
                  <Text className="text-base font-semibold uppercase text-gray-50">
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
