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
import { useAuthStore } from "../../src/stores/auth.store";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await authService.login(data.email, data.password);
      const user = await authService.me();
      setUser(user);
      router.replace("/(tabs)/");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) showToast("E-mail ou senha incorretos.", "error");
      else showToast("Erro ao fazer login. Tente novamente.", "error");
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
        contentContainerClassName="flex-1 justify-center px-md"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / título */}
        <View className="items-center mb-xl">
          <Text className="text-display-md text-primary font-black tracking-tight">SHADOW</Text>
          <Text className="text-display-md text-on-surface font-black tracking-tight -mt-2">LEVELING</Text>
          <Text className="text-label-md text-on-surface-variant mt-2 tracking-widest">TRACKER DE TREINOS</Text>
        </View>

        {/* Card */}
        <View className="bg-surface-low rounded-md p-lg gap-md border border-outline-variant">
          <Text className="text-headline-mobile text-on-surface font-bold">Entrar</Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                testID="login-email"
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
                testID="login-password"
                label="Senha"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                secureToggle
                placeholder="••••••••"
                error={errors.password?.message}
              />
            )}
          />

          <Button
            testID="login-submit"
            label="Entrar"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
          />
        </View>

        {/* Link para registro */}
        <View className="flex-row justify-center mt-lg gap-1">
          <Text className="text-body-md text-on-surface-variant">Não tem conta?</Text>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text className="text-body-md text-secondary font-semibold">Registrar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
