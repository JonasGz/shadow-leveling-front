import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Plus, Send } from "lucide-react-native";
import EmojiPicker from "rn-emoji-keyboard";
import { groupsService } from "../../../src/services/groups.service";
import { useToast } from "../../../src/components/ui/Toast";
import type {
  SessionSocialDetail,
  SessionComment,
} from "../../../src/types/api.types";

const HERO_HEIGHT = Math.round(Dimensions.get("window").height * 0.55);

// relativeTime renders "agora", "há 5 min", "há 2 h", "há 3 d" or a date.
function relativeTime(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "agora";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `há ${days} d`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

// Circular avatar with the name initial as fallback.
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
              borderColor: "#9F1FFF",
              boxShadow: "0px 0px 18px rgba(159,31,255,0.35)",
            }
          : { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }),
      }}
      className="bg-surface-high"
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <Text
          className="text-secondary font-bold"
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
      className="flex-row gap-3 mb-5 active:opacity-80"
    >
      <Avatar uri={comment.avatar_url} name={comment.name} size={36} />
      <View className="flex-1">
        <View className="flex-row items-baseline gap-2">
          <Text className="text-body-sm text-on-surface font-bold">
            {comment.name}
          </Text>
          <Text className="text-caption text-on-surface-variant">
            {relativeTime(comment.created_at)}
          </Text>
        </View>
        <Text className="text-body-sm text-on-surface mt-0.5">
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
    } catch {
      /* silent: keep what we have */
    }
  }

  async function sendComment() {
    if (!id || !sessionId) return;
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const created = await groupsService.addComment(id, sessionId, body);
      setComments((prev) => [created, ...prev]); // newest-first
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
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#c8a3ff" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-md">
        <Text className="text-on-surface-variant">Treino indisponível.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 96 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Hero photo */}
          <View style={{ height: HERO_HEIGHT }} className="w-full">
            {detail.photo_url ? (
              <Image
                source={{ uri: detail.photo_url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-surface-high" />
            )}
            {/* fade into the page */}
            <LinearGradient
              colors={["transparent", "rgba(17,17,19,0.7)", "#111113"]}
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
              className="absolute left-5 w-11 h-11 rounded-full bg-surface/60 border border-white/[0.12] items-center justify-center active:opacity-70"
            >
              <ChevronLeft size={22} color="#fff" />
            </Pressable>
          </View>

          {/* 2. Author */}
          <View className="flex-row items-start gap-3 px-5">
            <Avatar uri={detail.avatar_url} name={detail.name} size={56} ring />
            <View className="flex-1 pt-0.5">
              <Text className="text-body-lg text-on-surface font-bold">
                {detail.name}
              </Text>
              <Text className="text-body-sm text-secondary font-semibold mt-0.5">
                {detail.workout_name}
              </Text>
            </View>
            <Text className="text-body-sm text-on-surface-variant pt-1">
              {relativeTime(detail.created_at)}
            </Text>
          </View>

          {/* 3. Reactions */}
          <View className="flex-row flex-wrap items-center gap-2.5 px-5 pt-5">
            {detail.reactions.map((rc) => {
              const active = rc.emoji === detail.my_reaction;
              return (
                <Pressable
                  key={rc.emoji}
                  onPress={() => react(rc.emoji)}
                  className={`flex-row items-center gap-1.5 h-9 px-3.5 rounded-full border active:opacity-70 ${
                    active
                      ? "bg-primary/15 border-primary"
                      : "bg-surface-low border-white/[0.07]"
                  }`}
                  style={
                    active
                      ? { boxShadow: "0px 0px 14px rgba(159,31,255,0.35)" }
                      : undefined
                  }
                >
                  <Text style={{ fontSize: 16 }}>{rc.emoji}</Text>
                  <Text
                    className={`text-body-sm font-bold ${
                      active ? "text-on-surface" : "text-on-surface-variant"
                    }`}
                  >
                    {rc.count}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setPickerOpen(true)}
              className="w-9 h-9 rounded-full bg-primary/15 border border-primary/40 items-center justify-center active:opacity-70"
            >
              <Plus size={18} color="#CAA4FF" />
            </Pressable>
          </View>

          <View className="h-px bg-white/[0.07] mx-5 mt-5" />

          {/* 4. Comments */}
          <View className="px-5 pt-5">
            <Text className="text-caption font-bold uppercase text-on-surface-variant mb-4">
              Comentários
            </Text>
            {comments.length === 0 ? (
              <Text className="text-body-sm text-on-surface-variant pb-4">
                Seja o primeiro a comentar.
              </Text>
            ) : (
              comments.map((c) => (
                <CommentRow key={c.id} comment={c} onDelete={confirmDelete} />
              ))
            )}
            {cursor && (
              <Pressable onPress={loadMoreComments} className="py-2">
                <Text className="text-body-sm text-secondary font-semibold">
                  Carregar mais
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* 5. Fixed composer */}
        <View
          style={{ paddingBottom: insets.bottom + 12 }}
          className="flex-row items-center gap-2.5 px-5 pt-3 bg-background border-t border-white/[0.07]"
        >
          <View className="flex-1 flex-row items-center h-12 px-4 rounded-full bg-surface-low border border-white/[0.07]">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Adicionar comentário…"
              placeholderTextColor="#908D94"
              className="flex-1 text-body-sm py-0 text-on-surface"
              multiline
              maxLength={500}
              onSubmitEditing={sendComment}
            />
          </View>
          <Pressable
            onPress={sendComment}
            disabled={sending || draft.trim().length === 0}
            className="w-12 h-12 rounded-full bg-primary items-center justify-center active:opacity-80"
            style={{
              boxShadow: "0px 0px 18px rgba(159,31,255,0.35)",
              opacity: draft.trim().length === 0 ? 0.5 : 1,
            }}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Full emoji picker (opens on the reaction "+"). Pure-JS modal, so it
          works in the simulator without the software keyboard. */}
      <EmojiPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onEmojiSelected={(e) => react(e.emoji)}
        enableSearchBar
        theme={{
          backdrop: "#00000099",
          knob: "#9F1FFF",
          container: "#1A191C",
          header: "#908D94",
          category: {
            icon: "#908D94",
            iconActive: "#fff",
            container: "#111113",
            containerActive: "#9F1FFF",
          },
          search: {
            text: "#fff",
            placeholder: "#908D94",
            background: "#111113",
            icon: "#908D94",
          },
        }}
      />
    </View>
  );
}
