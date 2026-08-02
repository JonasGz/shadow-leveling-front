import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import Sparkles from "lucide-react-native/icons/sparkles";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { useToast } from "../../src/components/ui/Toast";
import { aiService } from "../../src/services/ai.service";
import { color } from "../../src/theme/palette";

const MIN_YEAR = 1900;

function maskDate(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];
  return parts.filter(Boolean).join("/");
}

function toISODate(masked: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(masked);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (year < MIN_YEAR || month < 1 || month > 12 || day < 1) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  const roundTrips =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!roundTrips) return null;
  if (date.getTime() > Date.now()) return null;

  return `${yyyy}-${mm}-${dd}`;
}

export default function AIConsentScreen() {
  const { pending } = useLocalSearchParams<{ pending?: string }>();
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function onAccept() {
    const iso = toISODate(birthDate);
    if (!iso) {
      setError("Informe uma data válida no formato DD/MM/AAAA");
      return;
    }
    setLoading(true);
    try {
      await aiService.acceptConsent(iso);
      router.replace({ pathname: "/ai", params: pending ? { pending } : {} });
    } catch {
      showToast("Não foi possível salvar. Tente de novo.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      <View className="flex-row items-center gap-2 px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={28} color={color.white} />
        </Pressable>
        <Text className="text-lg font-semibold text-white">
          Assistente de Treino
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerClassName="pb-10 gap-4"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center py-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/12">
              <Sparkles size={24} color={color["purple-100"]} />
            </View>
          </View>

          <Card className="gap-3">
            <Text className="text-base font-semibold text-white">
              Como funciona
            </Text>
            <Text className="text-sm text-gray-200">
              O assistente conversa com você para montar um treino. Ele faz
              algumas perguntas e sugere exercícios do catálogo do app — você
              revisa tudo antes de criar.
            </Text>
            <Text className="text-sm text-gray-200">
              Suas respostas nesta conversa são{" "}
              <Text className="font-semibold text-white">
                enviadas para um provedor de inteligência artificial
              </Text>{" "}
              para gerar a sugestão. As conversas não ficam salvas no app.
            </Text>
          </Card>

          <Card className="bg-warning/8 gap-2 border-warning/30">
            <Text className="text-sm font-semibold text-white">
              Sugestões geradas por IA
            </Text>
            <Text className="text-sm text-gray-200">
              Os treinos sugeridos não substituem a orientação de um
              profissional de educação física ou de um médico.
            </Text>
          </Card>

          <View className="gap-2">
            <Input
              label="Sua data de nascimento"
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              value={birthDate}
              onChangeText={(text) => {
                setError(null);
                setBirthDate(maskDate(text));
              }}
              error={error ?? undefined}
              maxLength={10}
            />
            <Text className="text-xs text-gray-300">
              O assistente está disponível para maiores de 18 anos.
            </Text>
          </View>

          <Button
            label="Aceitar e continuar"
            fullWidth
            loading={loading}
            onPress={onAccept}
          />
          <Button
            label="Agora não"
            variant="ghost"
            fullWidth
            onPress={() => router.back()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
