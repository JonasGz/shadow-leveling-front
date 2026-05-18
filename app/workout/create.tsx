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
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { useToast } from "../../src/components/ui/Toast";
import { workoutsService } from "../../src/services/workouts.service";
import { useWorkoutsStore } from "../../src/stores/workouts.store";
import type { DayOfWeek } from "../../src/types/api.types";

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "sunday", label: "DOM" },
  { value: "monday", label: "SEG" },
  { value: "tuesday", label: "TER" },
  { value: "wednesday", label: "QUA" },
  { value: "thursday", label: "QUI" },
  { value: "friday", label: "SEX" },
  { value: "saturday", label: "SÁB" },
];

const schema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(100, "Máximo 100 caracteres"),
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
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
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
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-md pt-md pb-sm">
        <Pressable onPress={() => router.back()} className="active:opacity-60 mb-md">
          <Text className="text-body-md text-secondary font-semibold">
            ‹ Voltar
          </Text>
        </Pressable>
        <Text className="text-label-md uppercase tracking-widest text-on-surface-variant">
          Novo
        </Text>
        <Text className="text-headline-mobile text-on-surface font-bold">
          Criar treino
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-md py-md gap-md"
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Nome do treino"
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
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Foco em peito e tríceps"
                multiline
                error={errors.description?.message}
              />
            )}
          />

          <View className="gap-1.5">
            <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant">
              Dias da semana
            </Text>
            <View className="flex-row flex-wrap gap-sm">
              {DAYS.map((d) => {
                const active = days.includes(d.value);
                return (
                  <Pressable
                    key={d.value}
                    onPress={() => toggleDay(d.value)}
                    className={`rounded-full px-4 py-2.5 border active:opacity-70 ${
                      active
                        ? "bg-primary/15 border-primary"
                        : "bg-transparent border-outline-variant"
                    }`}
                  >
                    <Text
                      className={`text-label-sm uppercase tracking-widest ${
                        active ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {daysError ? (
              <Text className="text-label-sm text-error">{daysError}</Text>
            ) : null}
          </View>

          <View className="mt-md">
            <Button
              label="Criar treino"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}