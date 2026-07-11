import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/stores/auth.store";
import { useToast } from "../../src/components/ui/Toast";
import { groupsService } from "../../src/services/groups.service";
import { pickImage } from "../../src/lib/pickImage";
import type { GroupDetail, FeedItem } from "../../src/types/api.types";

/** Buckets an ISO timestamp into "Hoje" / "Ontem" / "DD/MM". */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
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

function FeedRow({ item }: { item: FeedItem }) {
  const initial = item.name.charAt(0).toUpperCase();
  return (
    <View className="flex-row items-center gap-md py-sm">
      {item.photo_url ? (
        <Image
          source={{ uri: item.photo_url }}
          className="w-12 h-12 rounded-full"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-surface-high items-center justify-center">
          <Text className="text-title-md text-secondary font-bold">{initial}</Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-label-md text-on-surface font-semibold">
          {item.workout_name}
        </Text>
        <Text className="text-label-sm text-on-surface-variant">{item.name}</Text>
      </View>
      <Text className="text-label-sm text-on-surface-variant">
        {timeLabel(item.created_at)}
      </Text>
    </View>
  );
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);

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
    } catch {
      showToast("Não foi possível carregar o grupo");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
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
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#d0bcff" />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-md">
        <Text className="text-on-surface-variant">Grupo indisponível.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} tintColor="#d0bcff" />
        }
        onScrollEndDrag={loadMore}
      >
        {/* Cover */}
        <Pressable
          onPress={isOwner ? handleChangeCover : undefined}
          className="h-40 bg-surface-high items-center justify-center overflow-hidden"
        >
          {group.cover_url ? (
            <Image source={{ uri: group.cover_url }} className="w-full h-full" />
          ) : (
            <Text className="text-on-surface-variant text-label-sm uppercase tracking-widest">
              {isOwner ? "Toque para definir a capa" : "Sem capa"}
            </Text>
          )}
          {uploadingCover && (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <ActivityIndicator color="#d0bcff" />
            </View>
          )}
        </Pressable>

        <View className="px-md">
          <View className="flex-row justify-between items-start mt-md">
            <Text className="flex-1 text-headline-mobile text-on-surface font-bold pr-2">
              {group.name}
            </Text>
            <Pressable onPress={confirmLeave}>
              <Text className="text-label-sm uppercase tracking-widest text-error">
                Sair
              </Text>
            </Pressable>
          </View>
          <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant mt-1">
            Código: {group.invite_code} · {group.member_count} membros
          </Text>

          {/* Score header */}
          <View className="flex-row gap-md mt-lg">
            <View className="flex-1 bg-surface-container rounded-xl p-md items-center">
              <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant">
                Líder
              </Text>
              <Text className="text-headline-mobile text-secondary font-bold">
                {group.top_score}
              </Text>
              <Text className="text-label-sm text-on-surface-variant">pts / semana</Text>
            </View>
            <View className="flex-1 bg-surface-container rounded-xl p-md items-center">
              <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant">
                Você
              </Text>
              <Text className="text-headline-mobile text-on-surface font-bold">
                {group.my_score}
              </Text>
              <Text className="text-label-sm text-on-surface-variant">pts / semana</Text>
            </View>
          </View>

          {/* Feed grouped by day */}
          <Text className="text-title-md text-on-surface font-bold mt-xl mb-sm">
            Feed
          </Text>
          {sections.length === 0 ? (
            <Text className="text-on-surface-variant py-lg">
              Nenhum treino registrado ainda esta semana.
            </Text>
          ) : (
            <View className="pb-xl">
              {sections.map(([label, items]) => (
                <View key={label}>
                  <Text className="text-label-sm uppercase tracking-widest text-outline my-sm">
                    ─── {label} ───
                  </Text>
                  {items.map((it) => (
                    <FeedRow key={it.session_id} item={it} />
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
