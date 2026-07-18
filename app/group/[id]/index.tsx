import { memo, useCallback, useMemo, useRef, useState } from "react";
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
import { useAuthStore } from "../../../src/stores/auth.store";
import { useToast } from "../../../src/components/ui/Toast";
import { groupsService } from "../../../src/services/groups.service";
import { pickImage } from "../../../src/lib/pickImage";
import { inviteUrl } from "../../../src/lib/invite";
import { dayLabel, formatTime } from "../../../src/lib/date";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import LogOut from "lucide-react-native/icons/log-out";
import Award from "lucide-react-native/icons/award";
import Share2 from "lucide-react-native/icons/share-2";
import type { GroupDetail, FeedItem } from "../../../src/types/api.types";
import { color } from "../../../src/theme/palette";
import { cn } from "../../../src/lib/cn";

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

// Props são só primitivos + o item; ao paginar itens antigos, as linhas já
// renderizadas não refazem trabalho.
const FeedRow = memo(function FeedRow({
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
      className={cn(
        "flex-row items-center gap-3 rounded-lg bg-gray-600 px-3 py-3 active:opacity-70",
        first ? "" : "border-t border-white/7",
      )}
    >
      {item.photo_url ? (
        <Image
          source={{ uri: item.photo_url }}
          className="h-12 w-12 rounded-full"
        />
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-full border border-white/7 bg-gray-600">
          <Text className="text-label-md font-bold text-purple-200">
            {initial}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-body-lg font-bold text-white">
          {item.workout_name}
        </Text>
        <Text className="mt-1 text-label-sm text-gray-200">{item.name}</Text>
        {hasSocial && (
          <Text className="mt-1 text-label-sm text-gray-200">
            {item.reaction_count > 0 &&
              `${item.top_emoji ?? "🔥"} ${item.reaction_count}`}
            {item.reaction_count > 0 && item.comment_count > 0 && "  ·  "}
            {item.comment_count > 0 && `💬 ${item.comment_count}`}
          </Text>
        )}
      </View>
      <Text className="text-label-sm font-semibold text-gray-200">
        {formatTime(item.created_at)}
      </Text>
    </Pressable>
  );
});

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
        className={cn(
          "items-center justify-center overflow-hidden rounded-full bg-gray-600",
          badge === "you" ? "h-[52px] w-[52px]" : "h-[60px] w-[60px]",
        )}
        style={
          badge === "leader"
            ? {
                borderWidth: 1,
                borderColor: color["purple-300"],
                boxShadow: "0px 0px 0px 3px rgba(129, 19, 211,0.2)",
              }
            : { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }
        }
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-title-md font-bold text-purple-200">
            {initial}
          </Text>
        )}
      </View>
      <View className="items-center justify-center">
        <Text className="text-body-lg font-bold text-white">{score}</Text>
        {badge === "leader" ? (
          <Award
            size={20}
            color={color["purple-200"]}
            style={{ marginTop: 3 }}
          />
        ) : (
          <Text className="mt-1 text-label-sm text-gray-200">Você</Text>
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
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-700">
        <ActivityIndicator color={color["purple-100"]} />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-700 px-4">
        <Text className="text-gray-200">Grupo indisponível.</Text>
      </SafeAreaView>
    );
  }

  const myName = user?.nickname ?? user?.email?.split("@")[0] ?? "Você";

  return (
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      {/* Top App Bar (mesma das outras telas) */}
      <View className="h-16 flex-row items-center px-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="active:opacity-60"
        >
          <ChevronLeft size={22} color={color["gray-50"]} />
        </Pressable>
      </View>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={load}
            tintColor={color["purple-100"]}
          />
        }
        onScrollEndDrag={loadMore}
      >
        {/* Cover */}
        <Pressable
          onPress={isOwner ? handleChangeCover : undefined}
          className="h-[140px] items-center justify-center overflow-hidden px-4"
        >
          {group.cover_url ? (
            <Image
              source={{ uri: group.cover_url }}
              className="h-full w-full"
            />
          ) : (
            // ponytail: the mockup's radial purple glow isn't expressible with
            // expo-linear-gradient — approximated by the diagonal purple stops.
            <View className="h-full w-full items-center justify-center rounded-lg bg-gray-600">
              <Text className="text-label-sm uppercase text-gray-200">
                {isOwner ? "Toque para definir a capa" : "Sem capa"}
              </Text>
            </View>
          )}
          {uploadingCover && (
            <View className="absolute inset-0 items-center justify-center bg-black/40">
              <ActivityIndicator color={color["purple-100"]} />
            </View>
          )}
        </Pressable>

        {/* Title row */}
        <View className="flex-row items-center justify-between px-4 pb-1 pt-4">
          <View className="flex-1 pr-2">
            <Text className="text-title-xxl font-bold text-white">
              {group.name}
            </Text>
            <Text className="mt-1 text-label-sm text-gray-200">
              {group.member_count}{" "}
              {group.member_count === 1 ? "membro" : "membros"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={shareInvite}
              hitSlop={8}
              className="h-12 w-12 items-center justify-center rounded-lg border border-purple-300/30 bg-purple-300/10 active:opacity-70"
            >
              <Share2 size={17} color={color["purple-100"]} />
            </Pressable>
            <Pressable
              onPress={confirmLeave}
              hitSlop={8}
              className="h-12 w-12 items-center justify-center rounded-lg border border-error/30 bg-error/10 active:opacity-70"
            >
              <LogOut size={17} color={color.error} />
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
        <View className="px-4">
          {sections.length === 0 ? (
            <Text className="py-6 text-gray-200">
              Nenhum treino registrado ainda esta semana.
            </Text>
          ) : (
            <View className="pb-10">
              {sections.map(([label, items]) => (
                <View key={label}>
                  <Text className="mb-2 ml-1 mt-4 text-center text-label-sm uppercase tracking-widest text-gray-200">
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
