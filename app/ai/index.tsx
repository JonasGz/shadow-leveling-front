import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import SendHorizontal from "lucide-react-native/icons/send-horizontal";
import Flag from "lucide-react-native/icons/flag";
import Sparkles from "lucide-react-native/icons/sparkles";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { useToast } from "../../src/components/ui/Toast";
import {
  aiService,
  AIBlockedError,
  type AIMessage,
  type AIProposal,
} from "../../src/services/ai.service";
import { useWorkoutsStore } from "../../src/stores/workouts.store";
import { DAY_SHORT } from "../../src/lib/date";
import { FOCUS_RING, controlBorder } from "../../src/components/ui/Input";
import { color } from "../../src/theme/palette";
import { cn } from "../../src/lib/cn";

const OPENING_QUESTION = "Quantos dias por semana você quer treinar?";

const blockedMessages: Record<string, string> = {
  underage: "O assistente está disponível para maiores de 18 anos.",
  rate_limited:
    "Você usou bastante o assistente hoje. Tente de novo amanhã, ou monte seu treino manualmente.",
  unavailable: "O assistente não está disponível no momento.",
};

export default function AIChatScreen() {
  const { pending } = useLocalSearchParams<{ pending?: string }>();
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: "assistant", content: OPENING_QUESTION },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState(false);
  const [proposal, setProposal] = useState<AIProposal | null>(null);
  const [ended, setEnded] = useState(false);
  const [creating, setCreating] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const refreshWorkouts = useWorkoutsStore((s) => s.refresh);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, proposal]);

  const resent = useRef(false);
  useEffect(() => {
    if (!pending || resent.current) return;
    resent.current = true;
    send(pending);
  }, [pending]);

  async function send(pending?: string) {
    const text = (pending ?? draft).trim();
    if (!text || sending) return;

    const next: AIMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    setProposal(null);
    setSending(true);

    try {
      const res = await aiService.chat(next);

      if (res.state === "proposal" && res.proposal) {
        setProposal(res.proposal);
        setMessages([
          ...next,
          { role: "assistant", content: "Montei uma sugestão pra você:" },
        ]);
        return;
      }
      const text = res.text?.trim();
      if (text) {
        setMessages([...next, { role: "assistant", content: text }]);
      } else {
        showToast("Não consegui responder agora. Tente de novo.", "error");
      }
      if (res.state === "refusal" && res.health_stop) {
        setEnded(true);
      }
    } catch (error) {
      if (error instanceof AIBlockedError) {
        if (error.reason === "consent_required") {
          setMessages(messages);
          router.replace({
            pathname: "/ai/consent",
            params: { pending: text },
          });
          return;
        }
        showToast(blockedMessages[error.reason], "error");
        setEnded(true);
        return;
      }
      showToast("Não consegui responder agora. Tente de novo.", "error");
    } finally {
      setSending(false);
    }
  }

  async function createWorkout() {
    if (!proposal) return;
    setCreating(true);
    try {
      const workouts = await aiService.createWorkoutFromProposal(proposal);
      await refreshWorkouts();
      router.replace(
        workouts.length === 1
          ? `/workout/${workouts[0].id}`
          : "/(tabs)/workouts",
      );
    } catch {
      showToast("Não consegui criar o treino. Tente de novo.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function reportProposal() {
    if (!proposal) return;
    try {
      await aiService.report(
        "usuario_denunciou_proposta",
        JSON.stringify(proposal),
      );
      showToast("Denúncia enviada. Obrigado!", "success");
    } catch {
      showToast("Não consegui enviar a denúncia.", "error");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={28} color={color.white} />
        </Pressable>
        <View className="flex-1 flex-row items-center justify-center gap-5">
          <Sparkles size={20} color={color["purple-100"]} />
          <Text className="text-xl font-semibold text-white">
            Assistente de Treino
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1 pt-5"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerClassName="gap-3 pb-4"
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message, index) => (
            <View
              key={index}
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                message.role === "user"
                  ? "self-end bg-purple-300"
                  : "self-start border border-white/7 bg-gray-600",
              )}
            >
              <Text
                className={cn(
                  "text-base",
                  message.role === "user" ? "text-gray-50" : "text-gray-100",
                )}
              >
                {message.content}
              </Text>
            </View>
          ))}

          {sending && (
            <View className="self-start rounded-2xl border border-white/7 bg-gray-600 px-4 py-3">
              <ActivityIndicator size="small" color={color["purple-100"]} />
            </View>
          )}

          {proposal && (
            <ProposalPreview
              proposal={proposal}
              creating={creating}
              onCreate={createWorkout}
              onAdjust={() => setProposal(null)}
              onReport={reportProposal}
            />
          )}
        </ScrollView>

        {ended ? (
          <View
            className="gap-2 px-4"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <Button
              label="Criar treino manualmente"
              fullWidth
              onPress={() => router.replace("/workout/create")}
            />
            <Button
              label="Voltar"
              variant="ghost"
              fullWidth
              onPress={() => router.back()}
            />
          </View>
        ) : (
          <View
            className="flex-row items-end gap-2 px-4"
            style={{ paddingBottom: insets.bottom + 8 }}
          >
            <View
              className={cn(
                "flex-1 rounded-lg border bg-gray-600 px-4 py-3",
                controlBorder(focused),
              )}
              style={focused ? FOCUS_RING : undefined}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Escreva sua resposta…"
                placeholderTextColor={color["gray-300"]}
                multiline
                maxLength={2000}
                className="max-h-24 py-1 text-base text-white"
                onSubmitEditing={() => send()}
              />
            </View>
            <Pressable
              onPress={() => send()}
              disabled={sending || !draft.trim()}
              className={cn(
                "h-14 w-14 items-center justify-center rounded-lg bg-purple-300",
                (sending || !draft.trim()) && "opacity-50",
              )}
            >
              <SendHorizontal size={20} color={color.white} />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ProposalPreview({
  proposal,
  creating,
  onCreate,
  onAdjust,
  onReport,
}: {
  proposal: AIProposal;
  creating: boolean;
  onCreate: () => void;
  onAdjust: () => void;
  onReport: () => void;
}) {
  return (
    <Card className="gap-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-white">
            {proposal.name}
          </Text>
          <Text className="text-xs uppercase tracking-wider text-gray-300">
            {proposal.days.length === 1
              ? "1 treino por semana"
              : `${proposal.days.length} treinos por semana`}
          </Text>
        </View>
        <Pressable onPress={onReport} hitSlop={8}>
          <Flag size={18} color={color["gray-300"]} />
        </Pressable>
      </View>

      <View className="gap-4">
        {proposal.days.map((day) => (
          <View key={day.day_of_week} className="gap-2">
            <View className="flex-row items-baseline gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wider text-purple-100">
                {DAY_SHORT[day.day_of_week]}
              </Text>
              <Text className="flex-1 text-sm font-semibold text-white">
                {day.name}
              </Text>
            </View>
            {day.exercises.map((exercise) => (
              <View
                key={exercise.exercise_id}
                className="flex-row items-center justify-between gap-3"
              >
                <Text
                  className="flex-1 text-sm text-gray-100"
                  numberOfLines={1}
                >
                  {exercise.name}
                </Text>
                <Text className="text-xs text-gray-300">
                  {exercise.sets}×{exercise.reps_min}-{exercise.reps_max}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View className="bg-warning/8 flex-row items-start gap-2 rounded-lg p-3">
        <TriangleAlert size={16} color={color.warning} />
        <Text className="flex-1 text-xs text-gray-200">
          Sugestão gerada por IA. Não substitui a orientação de um profissional.
        </Text>
      </View>

      <Button
        label="Criar treino"
        fullWidth
        loading={creating}
        onPress={onCreate}
      />
      <Button
        label="Pedir ajuste"
        variant="tonal"
        fullWidth
        onPress={onAdjust}
      />
    </Card>
  );
}
