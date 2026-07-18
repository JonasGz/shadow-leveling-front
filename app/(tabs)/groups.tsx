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
          className={`w-6 h-6 rounded-full overflow-hidden border-[1.5px] border-surface-container bg-surface-high ${
            i > 0 ? "-ml-2" : ""
          }`}
        >
          <Image
            source={{ uri: url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
      ))}
      {rest > 0 && (
        <View
          className={`w-6 h-6 rounded-full border-[1.5px] border-surface-container bg-primary/25 items-center justify-center ${
            shown.length > 0 ? "-ml-2" : ""
          }`}
        >
          <Text className="text-[9px] font-bold text-secondary">+{rest}</Text>
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
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-md h-16">
        <Text className="text-title-xxl text-white font-bold">Grupos</Text>
        <Pressable
          onPress={() => setCreating(true)}
          className="w-14 h-14 items-center justify-center rounded-full border bg-surface-container border-card-border active:bg-primary"
        >
          <Text className="text-primary text-3xl">＋</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-md"
        contentContainerClassName="pb-[112px] pt-md"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#c8a3ff"
          />
        }
      >
        {loading ? (
          <ActivityIndicator className="mt-xl" color="#c8a3ff" />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={Swords}
            title="Nenhum grupo ainda"
            description="Crie um grupo no + ou entre pelo link de convite de um amigo."
          />
        ) : (
          <View className="pb-xl">
            <View className="gap-md">
              {groups.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => router.push(`/group/${g.id}`)}
                  className="relative bg-surface-container rounded-xl overflow-hidden pl-5 pr-md py-md flex-row items-center justify-between gap-3 active:opacity-80"
                >
                  <LinearGradient
                    colors={["#B26CFF", "#8113D3"]}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                    }}
                  />
                  <View className="flex-1">
                    <Text className="text-title-md text-on-surface font-bold">
                      {g.name}
                    </Text>
                    <Text className="text-label-sm text-on-surface-variant mt-1">
                      Código:{" "}
                      <Text className="font-semibold text-on-surface">
                        {g.invite_code}
                      </Text>
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <AvatarStack
                      avatars={g.member_avatars}
                      count={g.member_count}
                    />
                    <ChevronRight size={18} color="#6C6971" />
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
          className="flex-1 bg-black/70 items-center justify-center px-lg"
        >
          <View className="w-full bg-surface-container border border-outline-variant rounded-xl p-lg gap-md">
            <Text className="text-title-md text-on-surface font-bold">
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
            <View className="flex-row gap-md mt-sm">
              <Pressable
                onPress={() => {
                  setName("");
                  setCreating(false);
                }}
                disabled={busy}
                className="flex-1 rounded-lg border border-outline-variant py-3 items-center active:opacity-70"
              >
                <Text className="text-on-surface-variant text-label-md uppercase">
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
