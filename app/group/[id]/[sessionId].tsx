import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Image } from "../../../src/lib/image";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import Plus from "lucide-react-native/icons/plus";
import Send from "lucide-react-native/icons/send";
import EmojiPicker from "rn-emoji-keyboard";
import { groupsService } from "../../../src/services/groups.service";
import { useToast } from "../../../src/components/ui/Toast";
import { relativeTime } from "../../../src/lib/date";
import type {
  SessionSocialDetail,
  SessionComment,
} from "../../../src/types/api.types";
import { color } from "../../../src/theme/palette";
import { cn } from "../../../src/lib/cn";

function Avatar({
  uri,
  name,
  size,
  ring,
}: {
  uri: string | null;
  name: string;
  size: number;
  ring?: boolean;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        ...(ring
          ? {
              borderWidth: 2.5,
              borderColor: color["purple-300"],
              boxShadow: "0px 0px 18px rgba(129, 19, 211,0.35)",
            }
          : { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }),
      }}
      className="bg-gray-500"
    >
      {uri ? (
        <Image source={{ uri }} className="h-full w-full" contentFit="cover" />
      ) : (
        <Text
          className="font-bold text-purple-200"
          style={{ fontSize: size / 2.6 }}
        >
          {initial}
        </Text>
      )}
    </View>
  );
}

function CommentRow({
  comment,
  onDelete,
}: {
  comment: SessionComment;
  onDelete: (c: SessionComment) => void;
}) {
  return (
    <Pressable
      onLongPress={comment.is_mine ? () => onDelete(comment) : undefined}
      className="mb-5 flex-row gap-3 active:opacity-80"
    >
      <Avatar uri={comment.avatar_url} name={comment.name} size={36} />
      <View className="flex-1">
        <View className="flex-row items-baseline gap-2">
          <Text className="text-sm font-bold text-white">{comment.name}</Text>
          <Text className="text-xs font-medium text-gray-200">
            {relativeTime(comment.created_at)}
          </Text>
        </View>
        <Text className="mt-1 text-sm font-normal text-white">
          {comment.body}
        </Text>
      </View>
    </Pressable>
  );
}

export default function SessionPostScreen() {
  const { id, sessionId } = useLocalSearchParams<{
    id: string;
    sessionId: string;
  }>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const heroHeight = Math.round(useWindowDimensions().height * 0.55);

  const [detail, setDetail] = useState<SessionSocialDetail | null>(null);
  const [comments, setComments] = useState<SessionComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id || !sessionId) return;
    try {
      const [d, page] = await Promise.all([
        groupsService.sessionDetail(id, sessionId),
        groupsService.comments(id, sessionId),
      ]);
      setDetail(d);
      setComments(page.data);
      setCursor(page.cursor.has_more ? page.cursor.next_cursor : null);
    } catch {
      showToast("Não foi possível carregar o treino");
    } finally {
      setLoading(false);
    }
  }, [id, sessionId, showToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function react(emoji: string) {
    if (!id || !sessionId) return;
    try {
      const updated = await groupsService.setReaction(id, sessionId, emoji);
      setDetail(updated);
    } catch {
      showToast("Erro ao reagir");
    }
  }

  async function loadMoreComments() {
    if (!id || !sessionId || !cursor) return;
    try {
      const page = await groupsService.comments(id, sessionId, cursor);
      setComments((prev) => [...prev, ...page.data]);
      setCursor(page.cursor.has_more ? page.cursor.next_cursor : null);
    } catch {}
  }

  async function sendComment() {
    if (!id || !sessionId) return;
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const created = await groupsService.addComment(id, sessionId, body);
      setComments((prev) => [created, ...prev]);
      setDraft("");
      setDetail((d) => (d ? { ...d, comment_count: d.comment_count + 1 } : d));
    } catch {
      showToast("Erro ao comentar");
    } finally {
      setSending(false);
    }
  }

  function confirmDelete(comment: SessionComment) {
    Alert.alert("Excluir comentário", "Remover este comentário?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          if (!id || !sessionId) return;
          try {
            await groupsService.deleteComment(id, sessionId, comment.id);
            setComments((prev) => prev.filter((c) => c.id !== comment.id));
            setDetail((d) =>
              d ? { ...d, comment_count: Math.max(0, d.comment_count - 1) } : d,
            );
          } catch {
            showToast("Erro ao excluir");
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-700">
        <ActivityIndicator color={color["purple-100"]} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-700 px-4">
        <Text className="text-gray-200">Treino indisponível.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-700">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 96 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ height: heroHeight }} className="w-full">
            {detail.photo_url ? (
              <Image
                source={{ uri: detail.photo_url }}
                className="h-full w-full"
                contentFit="cover"
              />
            ) : (
              <View className="h-full w-full bg-gray-500" />
            )}
            <LinearGradient
              colors={["transparent", "rgba(17,17,19,0.7)", color["gray-700"]]}
              locations={[0.55, 0.85, 1]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "50%",
              }}
              pointerEvents="none"
            />
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={{ top: insets.top + 8 }}
              className="absolute left-5 h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-gray-600/60 active:opacity-70"
            >
              <ChevronLeft size={22} color={color.white} />
            </Pressable>
          </View>

          <View className="flex-row items-start gap-3 px-5">
            <Avatar uri={detail.avatar_url} name={detail.name} size={56} ring />
            <View className="flex-1 pt-1">
              <Text className="text-lg font-bold text-white">
                {detail.name}
              </Text>
              <Text className="mt-1 text-sm font-semibold text-purple-200">
                {detail.workout_name}
              </Text>
            </View>
            <Text className="pt-1 text-sm font-normal text-gray-200">
              {relativeTime(detail.created_at)}
            </Text>
          </View>

          <View className="flex-row flex-wrap items-center gap-3 px-5 pt-5">
            {detail.reactions.map((rc) => {
              const active = rc.emoji === detail.my_reaction;
              return (
                <Pressable
                  key={rc.emoji}
                  onPress={() => react(rc.emoji)}
                  className={cn(
                    "h-9 flex-row items-center gap-2 rounded-full border px-4 active:opacity-70",
                    active
                      ? "border-purple-300 bg-purple-300/15"
                      : "border-white/7 bg-gray-600",
                  )}
                  style={
                    active
                      ? { boxShadow: "0px 0px 14px rgba(129, 19, 211,0.35)" }
                      : undefined
                  }
                >
                  <Text className="text-base font-normal">{rc.emoji}</Text>
                  <Text
                    className={cn(
                      "text-sm font-bold",
                      active ? "text-white" : "text-gray-200",
                    )}
                  >
                    {rc.count}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setPickerOpen(true)}
              className="h-9 w-9 items-center justify-center rounded-full border border-purple-300/40 bg-purple-300/15 active:opacity-70"
            >
              <Plus size={18} color={color["purple-100"]} />
            </Pressable>
          </View>

          <View className="mx-5 mt-5 h-px bg-white/7" />

          <View className="px-5 pt-5">
            <Text className="mb-4 text-xs font-bold uppercase text-gray-200">
              Comentários
            </Text>
            {comments.length === 0 ? (
              <Text className="pb-4 text-sm font-normal text-gray-200">
                Seja o primeiro a comentar.
              </Text>
            ) : (
              comments.map((c) => (
                <CommentRow key={c.id} comment={c} onDelete={confirmDelete} />
              ))
            )}
            {cursor && (
              <Pressable onPress={loadMoreComments} className="py-2">
                <Text className="text-sm font-semibold text-purple-200">
                  Carregar mais
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        <View
          style={{ paddingBottom: insets.bottom + 12 }}
          className="flex-row items-center gap-3 border-t border-white/7 bg-gray-700 px-5 pt-3"
        >
          <View className="h-12 flex-1 flex-row items-center rounded-full border border-white/7 bg-gray-600 px-4">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Adicionar comentário…"
              placeholderTextColor={color["gray-200"]}
              className="flex-1 py-0 text-sm font-normal text-white"
              multiline
              maxLength={500}
              onSubmitEditing={sendComment}
            />
          </View>
          <Pressable
            onPress={sendComment}
            disabled={sending || draft.trim().length === 0}
            className="h-12 w-12 items-center justify-center rounded-full bg-purple-300 active:opacity-80"
            style={{
              boxShadow: "0px 0px 18px rgba(129, 19, 211,0.35)",
              opacity: draft.trim().length === 0 ? 0.5 : 1,
            }}
          >
            {sending ? (
              <ActivityIndicator color={color.white} size="small" />
            ) : (
              <Send size={20} color={color.white} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <EmojiPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={(e) => react(e.emoji)}
        enableSearchBar
        theme={{
          backdrop: "#00000099",
          knob: color["purple-300"],
          container: color["gray-600"],
          header: color["gray-200"],
          category: {
            icon: color["gray-200"],
            iconActive: color.white,
            container: color["gray-700"],
            containerActive: color["purple-300"],
          },
          search: {
            text: color.white,
            placeholder: color["gray-200"],
            background: color["gray-700"],
            icon: color["gray-200"],
          },
        }}
      />
    </View>
  );
}
