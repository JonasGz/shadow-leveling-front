import { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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

// Overlapping member avatars for a group card. Shows up to 3 real avatars and a
// "+N" bubble for the remaining members. Falls back to a plain purple circle
// when a slot has no photo (mirrors the profile screen's avatar fallback).
function AvatarStack({ avatars, count }: { avatars: string[]; count: number }) {
  const shown = avatars.slice(0, 3);
  const rest = count - shown.length;
  return (
    <View className="flex-row items-center">
      {shown.map((url, i) => (
        <View
          key={i}
          className={cn(
            "h-6 w-6 overflow-hidden rounded-full border-[1.5px] border-gray-600 bg-gray-500",
            i > 0 && "-ml-2",
          )}
        >
          <Image
            source={{ uri: url }}
            className="h-full w-full"
            resizeMode="cover"
          />
        </View>
      ))}
      {rest > 0 && (
        <View
          className={cn(
            "h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-gray-600 bg-purple-300/25",
            shown.length > 0 && "-ml-2",
          )}
        >
          <Text className="text-[9px] font-bold text-purple-200">+{rest}</Text>
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
      // Relança para o hook marcar erro sem descartar a lista já exibida.
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
      {/* TopAppBar */}
      <View className="h-16 flex-row items-center justify-between px-4">
        <Text className="text-title-xxl font-bold text-white">Grupos</Text>
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
                  className="relative flex-row items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gray-600 py-4 pl-5 pr-4 active:opacity-80"
                >
                  <LinearGradient
                    colors={[color["purple-200"], color["purple-300"]]}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                    }}
                  />
                  <View className="flex-1">
                    <Text className="text-title-md font-bold text-white">
                      {g.name}
                    </Text>
                    <Text className="mt-1 text-label-sm text-gray-200">
                      Código:{" "}
                      <Text className="font-semibold text-white">
                        {g.invite_code}
                      </Text>
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

      {/* Modal de criação de grupo */}
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
          <View className="w-full gap-4 rounded-2xl border border-gray-300 bg-gray-600 p-6">
            <Text className="text-title-md font-bold text-white">
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
                <Text className="text-label-md uppercase text-gray-200">
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
