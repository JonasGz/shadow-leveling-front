import { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
  AppState,
  Share,
} from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../../src/stores/auth.store";
import { useToast } from "../../../src/components/ui/Toast";
import { groupsService } from "../../../src/services/groups.service";
import { pickImage } from "../../../src/lib/pickImage";
import { inviteUrl } from "../../../src/lib/invite";
import { ChevronLeft, LogOut, Award, Share2 } from "lucide-react-native";
import type { GroupDetail, FeedItem } from "../../../src/types/api.types";

/** Buckets an ISO timestamp into "Hoje" / "Ontem" / "DD/MM". */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  if (diffDays <= 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const POLL_MS = 15000;

// Lightweight signature to detect real changes: scores + the newest feed item.
// (Deliberately ignores feed length so paginating older items doesn't count as
// a change and trigger a reset.)
function signature(
  topScore: number,
  myScore: number,
  headSessionId: string,
): string {
  return `${topScore}-${myScore}-${headSessionId}`;
}

function FeedRow({
  item,
  first,
  groupId,
}: {
  item: FeedItem;
  first: boolean;
  groupId: string;
}) {
  const initial = item.name.charAt(0).toUpperCase();
  const hasSocial = item.reaction_count > 0 || item.comment_count > 0;
  return (
    <Pressable
      onPress={() => router.push(`/group/${groupId}/${item.session_id}`)}
      className={`flex-row items-center bg-surface-container rounded-lg px-3 gap-3 py-3 active:opacity-70 ${
        first ? "" : "border-t border-white/5"
      }`}
    >
      {item.photo_url ? (
        <Image
          source={{ uri: item.photo_url }}
          className="w-12 h-12 rounded-full"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-surface-container border border-white/[0.07] items-center justify-center">
          <Text className="text-label-md text-secondary font-bold">
            {initial}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-body-lg text-on-surface font-bold">
          {item.workout_name}
        </Text>
        <Text className="text-label-sm text-on-surface-variant mt-0.5">
          {item.name}
        </Text>
        {hasSocial && (
          <Text className="text-label-sm text-on-surface-variant mt-1">
            {item.reaction_count > 0 &&
              `${item.top_emoji ?? "🔥"} ${item.reaction_count}`}
            {item.reaction_count > 0 && item.comment_count > 0 && "  ·  "}
            {item.comment_count > 0 && `💬 ${item.comment_count}`}
          </Text>
        )}
      </View>
      <Text className="text-label-sm text-on-surface-variant font-semibold">
        {timeLabel(item.created_at)}
      </Text>
    </Pressable>
  );
}

// A compact podium item: circular avatar (initial), then the week's score with a
// trophy (leader) or a "Você" label (current user) beneath it. The current
// user's avatar gets a purple highlight ring.
function PodiumItem({
  name,
  score,
  badge,
  avatarUrl,
}: {
  name: string;
  score: number;
  badge: "leader" | "you";
  avatarUrl?: string | null;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <View className="flex-row items-center gap-2">
      <View
        className={`rounded-full bg-surface-container items-center justify-center overflow-hidden ${
          badge === "you" ? "w-[52px] h-[52px]" : "w-[60px] h-[60px]"
        }`}
        style={
          badge === "leader"
            ? {
                borderWidth: 1,
                borderColor: "#9F1FFF",
                boxShadow: "0px 0px 0px 3px rgba(159,31,255,0.2)",
              }
            : { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }
        }
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <Text className="text-title-md text-secondary font-bold">
            {initial}
          </Text>
        )}
      </View>
      <View className="justify-center items-center">
        <Text className="text-body-lg text-on-surface font-bold">{score}</Text>
        {badge === "leader" ? (
          <Award size={20} color="#B26CFF" style={{ marginTop: 3 }} />
        ) : (
          <Text className="text-label-sm text-on-surface-variant mt-0.5">
            Você
          </Text>
        )}
      </View>
    </View>
  );
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const sigRef = useRef("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [detail, page] = await Promise.all([
        groupsService.get(id),
        groupsService.feed(id),
      ]);
      setGroup(detail);
      setFeed(page.data);
      setCursor(page.cursor.has_more ? page.cursor.next_cursor : null);
      sigRef.current = signature(
        detail.top_score,
        detail.my_score,
        page.data[0]?.session_id ?? "",
      );
    } catch {
      showToast("Não foi possível carregar o grupo");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  // Silent poll: fetches fresh data but only re-renders if the signature moved.
  const poll = useCallback(async () => {
    if (!id) return;
    try {
      const [detail, page] = await Promise.all([
        groupsService.get(id),
        groupsService.feed(id),
      ]);
      const sig = signature(
        detail.top_score,
        detail.my_score,
        page.data[0]?.session_id ?? "",
      );
      if (sig === sigRef.current) return; // nada mudou → nenhum setState/re-render
      sigRef.current = sig;
      setGroup(detail);
      setFeed(page.data);
      setCursor(page.cursor.has_more ? page.cursor.next_cursor : null);
    } catch {
      // silencioso: mantém o que já está na tela
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(() => {
        if (AppState.currentState === "active") poll();
      }, POLL_MS);
      return () => clearInterval(interval);
    }, [load, poll]),
  );

  async function loadMore() {
    if (!id || !cursor) return;
    try {
      const page = await groupsService.feed(id, cursor);
      setFeed((prev) => [...prev, ...page.data]);
      setCursor(page.cursor.has_more ? page.cursor.next_cursor : null);
    } catch {
      /* silent: keep what we have */
    }
  }

  const isOwner = group != null && group.owner_id === currentUserId;

  async function handleChangeCover() {
    if (!id) return;
    const uri = await pickImage();
    if (!uri) return;
    setUploadingCover(true);
    try {
      const updated = await groupsService.setCover(id, uri);
      setGroup((g) => (g ? { ...g, cover_url: updated.cover_url } : g));
    } catch {
      showToast("Erro ao enviar a capa");
    } finally {
      setUploadingCover(false);
    }
  }

  async function shareInvite() {
    if (!group) return;
    const url = inviteUrl(group.invite_code);
    try {
      await Share.share({
        message: `Entra no meu grupo "${group.name}" no Shadow Leveling: ${url}`,
      });
    } catch {
      /* user dismissed the share sheet */
    }
  }

  function confirmLeave() {
    if (!id) return;
    Alert.alert("Sair do grupo", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await groupsService.leave(id);
            router.back();
          } catch {
            showToast("Erro ao sair do grupo");
          }
        },
      },
    ]);
  }

  // Group feed items by day for the "--- Hoje ---" separators.
  const sections = useMemo(() => {
    const map = new Map<string, FeedItem[]>();
    for (const item of feed) {
      const label = dayLabel(item.created_at);
      const arr = map.get(label) ?? [];
      arr.push(item);
      map.set(label, arr);
    }
    return Array.from(map.entries());
  }, [feed]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#c8a3ff" />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-md">
        <Text className="text-on-surface-variant">Grupo indisponível.</Text>
      </SafeAreaView>
    );
  }

  const myName = user?.nickname ?? user?.email?.split("@")[0] ?? "Você";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Top App Bar (mesma das outras telas) */}
      <View className="flex-row items-center px-md h-16">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="active:opacity-60"
        >
          <ChevronLeft size={22} color="#DCDCDD" />
        </Pressable>
      </View>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={load}
            tintColor="#c8a3ff"
          />
        }
        onScrollEndDrag={loadMore}
      >
        {/* Cover */}
        <Pressable
          onPress={isOwner ? handleChangeCover : undefined}
          className="h-[140px] px-md items-center justify-center overflow-hidden"
        >
          {group.cover_url ? (
            <Image
              source={{ uri: group.cover_url }}
              className="w-full h-full"
            />
          ) : (
            // ponytail: the mockup's radial purple glow isn't expressible with
            // expo-linear-gradient — approximated by the diagonal purple stops.
            <View className="w-full h-full bg-surface-container rounded-lg items-center justify-center">
              <Text className="text-label-sm uppercase text-on-surface-variant">
                {isOwner ? "Toque para definir a capa" : "Sem capa"}
              </Text>
            </View>
          )}
          {uploadingCover && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <ActivityIndicator color="#c8a3ff" />
            </View>
          )}
        </Pressable>

        {/* Title row */}
        <View className="px-md pt-md pb-1 flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-title-xxl text-on-surface font-bold">
              {group.name}
            </Text>
            <Text className="text-label-sm text-on-surface-variant mt-1">
              {group.member_count}{" "}
              {group.member_count === 1 ? "membro" : "membros"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={shareInvite}
              hitSlop={8}
              className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 items-center justify-center active:opacity-70"
            >
              <Share2 size={17} color="#CAA4FF" />
            </Pressable>
            <Pressable
              onPress={confirmLeave}
              hitSlop={8}
              className="w-12 h-12 rounded-lg bg-error/10 border border-error/30 items-center justify-center active:opacity-70"
            >
              <LogOut size={17} color="#FF5C74" />
            </Pressable>
          </View>
        </View>

        {/* Podium: leader + you */}
        <View className="flex-row justify-center gap-6 py-4">
          <PodiumItem
            name={group.top_name}
            score={group.top_score}
            badge="leader"
            avatarUrl={group.top_avatar_url}
          />
          <PodiumItem
            name={myName}
            score={group.my_score}
            badge="you"
            avatarUrl={user?.avatar_url}
          />
        </View>

        {/* Feed grouped by day */}
        <View className="px-md">
          {sections.length === 0 ? (
            <Text className="text-on-surface-variant py-lg">
              Nenhum treino registrado ainda esta semana.
            </Text>
          ) : (
            <View className="pb-xl">
              {sections.map(([label, items]) => (
                <View key={label}>
                  <Text className="text-label-sm text-center uppercase tracking-widest text-on-surface-variant mt-md mb-2 ml-1">
                    {label}
                  </Text>
                  <View className="flex flex-col gap-2">
                    {items.map((it, i) => (
                      <FeedRow
                        key={it.session_id}
                        item={it}
                        first={i === 0}
                        groupId={id}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
