import { useState, useEffect, useCallback } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { OTPInput } from "../../src/components/ui/OTPInput";
import { Button } from "../../src/components/ui/Button";
import { useToast } from "../../src/components/ui/Toast";
import { useAuthStore } from "../../src/stores/auth.store";
import { authService } from "../../src/services/auth.service";

const RESEND_COOLDOWN = 60;

export default function LoginVerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [hasError, setHasError] = useState(false);
  const { showToast } = useToast();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = useCallback(async () => {
    if (code.length < 6) return;
    setLoading(true);
    setHasError(false);
    try {
      await authService.loginVerify(email, code);
      const user = await authService.me();
      setUser(user);
      router.replace("/(tabs)/");
    } catch (err: any) {
      setHasError(true);
      setCode("");
      const status = err?.response?.status;
      if (status === 422) showToast("Código inválido ou expirado.", "error");
      else showToast("Erro ao verificar código.", "error");
    } finally {
      setLoading(false);
    }
  }, [code, email]);

  // Auto-submit quando preenche os 6 dígitos
  useEffect(() => {
    if (code.length === 6) handleVerify();
  }, [code]);

  async function handleResend() {
    setResendLoading(true);
    try {
      await authService.loginResend(email);
      setCountdown(RESEND_COOLDOWN);
      showToast("Novo código enviado para seu e-mail.", "success");
    } catch (err: any) {
      if (err?.response?.status === 429)
        showToast("Muitas tentativas. Aguarde antes de reenviar.", "warning");
      else showToast("Erro ao reenviar código.", "error");
    } finally {
      setResendLoading(false);
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
        <View className="items-center mb-xl">
          <Text className="text-display-md text-primary font-black tracking-tight">SHADOW</Text>
          <Text className="text-display-md text-on-surface font-black tracking-tight -mt-2">LEVELING</Text>
        </View>

        <View className="bg-surface-low rounded-md p-lg gap-lg border border-outline-variant">
          <View className="gap-1">
            <Text className="text-headline-mobile text-on-surface font-bold">Verificar acesso</Text>
            <Text className="text-body-md text-on-surface-variant">
              Enviamos um código de 6 dígitos para
            </Text>
            <Text className="text-body-md text-primary font-semibold">{email}</Text>
          </View>

          <OTPInput value={code} onChange={setCode} error={hasError} />

          <Button
            label="Verificar"
            onPress={handleVerify}
            loading={loading}
            disabled={code.length < 6}
            fullWidth
          />

          {/* Reenviar */}
          <View className="items-center">
            {countdown > 0 ? (
              <Text className="text-label-md text-on-surface-variant tracking-widest">
                REENVIAR EM {countdown}S
              </Text>
            ) : (
              <Pressable onPress={handleResend} disabled={resendLoading}>
                <Text className="text-label-md text-secondary tracking-widest">
                  {resendLoading ? "ENVIANDO..." : "REENVIAR CÓDIGO"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <Pressable onPress={() => router.back()} className="items-center mt-lg">
          <Text className="text-label-md text-on-surface-variant tracking-widest">← VOLTAR</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
