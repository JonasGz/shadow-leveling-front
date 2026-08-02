import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { useToast } from "../../src/components/ui/Toast";
import { workoutsService } from "../../src/services/workouts.service";
import { useWorkoutsStore } from "../../src/stores/workouts.store";
import { DAY_ORDER, DAY_UPPER } from "../../src/lib/date";
import type { DayOfWeek } from "../../src/types/api.types";
import { color } from "../../src/theme/palette";
import { cn } from "../../src/lib/cn";

const DAYS = DAY_ORDER.map((value) => ({ value, label: DAY_UPPER[value] }));

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome obrigatório")
    .max(100, "Máximo 100 caracteres"),
  description: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateWorkoutScreen() {
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<DayOfWeek[]>([]);
  const [daysError, setDaysError] = useState<string | null>(null);
  const { showToast } = useToast();
  const refreshWorkouts = useWorkoutsStore((s) => s.refresh);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function toggleDay(day: DayOfWeek) {
    setDaysError(null);
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function onSubmit(data: FormData) {
    if (days.length === 0) {
      setDaysError("Selecione ao menos um dia");
      return;
    }
    setLoading(true);
    try {
      const workout = await workoutsService.create({
        name: data.name,
        description: data.description || undefined,
        days_of_week: days,
      });
      await refreshWorkouts();
      showToast("Treino criado.", "success");
      router.replace(`/workout/${workout.id}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) showToast("Dados inválidos.", "error");
      else showToast("Erro ao criar treino.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      <View className="h-16 flex-row items-center justify-between px-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="active:opacity-60"
        >
          <ChevronLeft size={22} color={color["gray-50"]} />
        </Pressable>
        <Text className="text-2xl font-bold text-white">Criar treino</Text>
        <View className="w-[22px]" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-4 py-4 gap-6"
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Nome do treino"
                centeredLabel
                labelSize="sm"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Ex: Treino A - Peito e Tríceps"
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Descrição (opcional)"
                centeredLabel
                labelSize="sm"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Foco em peito e tríceps"
                multiline
                error={errors.description?.message}
              />
            )}
          />

          <View className="gap-2">
            <Text className="text-center text-xs font-normal uppercase text-gray-200">
              Dias da semana
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DAYS.map((d) => {
                const active = days.includes(d.value);
                return (
                  <Pressable
                    key={d.value}
                    onPress={() => toggleDay(d.value)}
                    className={cn(
                      "rounded-full border px-3 py-2 active:opacity-70",
                      active
                        ? "bg-purple-300"
                        : "border-white/10 bg-transparent",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm font-normal uppercase",
                        active ? "text-white" : "text-white",
                      )}
                    >
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {daysError ? (
              <Text className="text-xs font-medium text-error">
                {daysError}
              </Text>
            ) : null}
          </View>

          <View className="mt-4">
            <Button
              label="Criar treino"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              fullWidth
            />
            <Text className="font-nomrla text-normal mt-2 text-center text-gray-300">
              Você poderá adicionar exercícios no próximo passo.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
