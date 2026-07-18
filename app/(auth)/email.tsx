import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { useToast } from "../../src/components/ui/Toast";
import { authService } from "../../src/services/auth.service";
import { finishAuth } from "../../src/lib/finishAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "email" | "code";

export default function EmailAuthScreen() {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    if (!EMAIL_RE.test(email)) {
      showToast("E-mail inválido.", "error");
      return;
    }
    setLoading(true);
    try {
      await authService.requestEmailCode(email.trim());
      setStep("code");
      showToast("Enviamos um código para o seu e-mail.", "success");
    } catch {
      showToast("Não foi possível enviar o código. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (code.length !== 6) {
      showToast("O código tem 6 dígitos.", "error");
      return;
    }
    setLoading(true);
    try {
      await authService.verifyEmailCode(email.trim(), code);
      await finishAuth();
    } catch (err: any) {
      if (err?.response?.status === 422)
        showToast("Código inválido ou expirado.", "error");
      else showToast("Não foi possível entrar. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <Pressable
          onPress={() => (step === "code" ? setStep("email") : router.back())}
          hitSlop={12}
          className="absolute left-md top-20 z-10 p-1"
        >
          <ChevronLeft size={28} color="#fff" />
        </Pressable>
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-lg"
          keyboardShouldPersistTaps="handled"
        >
          {step === "email" ? (
            <View className="gap-md">
              <Text className="text-headline-mobile font-bold text-on-surface">
                Entrar com e-mail
              </Text>
              <Text className="text-body-md text-on-surface-variant">
                Enviaremos um código de acesso para o seu e-mail.
              </Text>
              <Input
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholder="seu@email.com"
              />
              <Button
                label="Enviar código"
                onPress={sendCode}
                loading={loading}
                fullWidth
              />
            </View>
          ) : (
            <View className="gap-md">
              <Text className="text-headline-mobile font-bold text-on-surface">
                Digite o código
              </Text>
              <Text className="text-body-md text-on-surface-variant">
                Enviamos um código de 6 dígitos para {email}.
              </Text>
              <Input
                label="Código"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                placeholder="000000"
              />
              <Button
                label="Entrar"
                onPress={verify}
                loading={loading}
                fullWidth
              />
              <View className="mt-1 flex-row justify-center gap-1">
                <Text className="text-body-md text-on-surface-variant">
                  Não recebeu?
                </Text>
                <Pressable onPress={sendCode} disabled={loading}>
                  <Text className="text-body-md font-semibold text-secondary">
                    Reenviar
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => setStep("email")}
                className="items-center"
              >
                <Text className="text-body-md text-on-surface-variant">
                  Usar outro e-mail
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
