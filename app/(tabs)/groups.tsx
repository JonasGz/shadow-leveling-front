import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "../../src/lib/image";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import Swords from "lucide-react-native/icons/swords";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useToast } from "../../src/components/ui/Toast";
import { groupsService } from "../../src/services/groups.service";
import { useScreenData } from "../../src/hooks/useScreenData";
import { color } from "../../src/theme/palette";
import { cn } from "../../src/lib/cn";

function AvatarStack({ avatars, count }: { avatars: string[]; count: number }) {
  const shown = avatars.slice(0, 3);
  const rest = count - shown.length;
  return (
    <View className="flex-row items-center">
      {shown.map((url, i) => (
        <View
          key={i}
          className={cn(
            "h-7 w-7 overflow-hidden rounded-full border-[1.5px] border-gray-600 bg-gray-500",
            i > 0 && "-ml-2",
          )}
        >
          <Image
            source={{ uri: url }}
            className="h-full w-full"
            contentFit="cover"
          />
        </View>
      ))}
      {rest > 0 && (
        <View
          className={cn(
            "h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-gray-600 bg-purple-300/25",
            shown.length > 0 && "-ml-2",
          )}
        >
          <Text className="text-xs font-bold text-purple-200">
            {rest > 99 ? "+99" : `+${rest}`}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function GroupsScreen() {
  const { showToast } = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, loading, refreshing, refresh } = useScreenData(async () => {
    try {
      return await groupsService.list();
    } catch (e) {
      showToast("Não foi possível carregar seus grupos");
      throw e;
    }
  });

  const groups = data ?? [];

  async function handleCreate() {
    if (name.trim().length === 0) return;
    setBusy(true);
    try {
      const g = await groupsService.create(name.trim());
      setName("");
      setCreating(false);
      router.push(`/group/${g.id}`);
    } catch {
      showToast("Erro ao criar grupo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      <View className="h-16 flex-row items-center justify-between px-4">
        <Text className="text-4xl font-bold text-white">Grupos</Text>
        <Pressable
          onPress={() => setCreating(true)}
          className="h-14 w-14 items-center justify-center rounded-full border border-white/7 bg-gray-600 active:bg-purple-300"
        >
          <Text className="text-3xl text-purple-300">＋</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="pb-[112px] pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={color["purple-100"]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator className="mt-10" color={color["purple-100"]} />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={Swords}
            title="Nenhum grupo ainda"
            description="Crie um grupo no + ou entre pelo link de convite de um amigo."
          />
        ) : (
          <View className="pb-10">
            <View className="gap-4">
              {groups.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => router.push(`/group/${g.id}`)}
                  className="relative flex-row items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gray-600 p-4 active:opacity-80"
                >
                  <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-purple-300/25">
                    {g.cover_url ? (
                      <Image
                        source={{ uri: g.cover_url }}
                        className="h-full w-full"
                        contentFit="cover"
                      />
                    ) : (
                      <Swords size={20} color={color["purple-200"]} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-semibold text-white">
                      {g.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <AvatarStack
                      avatars={g.member_avatars}
                      count={g.member_count}
                    />
                    <ChevronRight size={18} color={color["gray-300"]} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={creating}
        transparent
        animationType="fade"
        onRequestClose={() => setCreating(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 items-center justify-center bg-black/70 px-6"
        >
          <View className="w-full gap-4 rounded-2xl border border-white/7 bg-gray-600 p-6">
            <Text className="text-xl font-bold text-white">
              Criar novo grupo
            </Text>
            <Input
              label="Nome do grupo"
              placeholder="Ex: Botinhas"
              value={name}
              onChangeText={setName}
              maxLength={100}
              autoFocus
            />
            <View className="mt-2 flex-row gap-4">
              <Pressable
                onPress={() => {
                  setName("");
                  setCreating(false);
                }}
                disabled={busy}
                className="flex-1 items-center rounded-lg border border-gray-300 py-3 active:opacity-70"
              >
                <Text className="text-base font-semibold uppercase text-gray-200">
                  Cancelar
                </Text>
              </Pressable>
              <View className="flex-1">
                <Button
                  label="Criar"
                  size="sm"
                  fullWidth
                  loading={busy}
                  onPress={handleCreate}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
