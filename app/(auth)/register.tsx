import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { useToast } from "../../src/components/ui/Toast";
import { authService } from "../../src/services/auth.service";

const schema = z
  .object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Mínimo de 8 caracteres"),
    confirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await authService.register(data.email, data.password);
      router.push({ pathname: "/(auth)/register-verify", params: { email: data.email } });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) showToast("E-mail já cadastrado.", "warning");
      else showToast("Erro ao criar conta. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-md py-xl"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-xl">
          <Text className="text-display-md text-primary font-black tracking-tight">SHADOW</Text>
          <Text className="text-display-md text-on-surface font-black tracking-tight -mt-2">LEVELING</Text>
          <Text className="text-label-md text-on-surface-variant mt-2 tracking-widest">CRIAR CONTA</Text>
        </View>

        <View className="bg-surface-low rounded-md p-lg gap-md border border-outline-variant">
          <Text className="text-headline-mobile text-on-surface font-bold">Registrar</Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="E-mail"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="seu@email.com"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Senha"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                secureToggle
                placeholder="Mínimo 8 caracteres"
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirm"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Confirmar senha"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                secureToggle
                placeholder="Repita a senha"
                error={errors.confirm?.message}
              />
            )}
          />

          <Button
            label="Criar conta"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
          />
        </View>

        <View className="flex-row justify-center mt-lg gap-1">
          <Text className="text-body-md text-on-surface-variant">Já tem conta?</Text>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Text className="text-body-md text-secondary font-semibold">Entrar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
