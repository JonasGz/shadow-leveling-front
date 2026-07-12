import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useToast } from "../../src/components/ui/Toast";
import { groupsService } from "../../src/services/groups.service";
import type { Group } from "../../src/types/api.types";

export default function GroupsScreen() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setGroups(await groupsService.list());
    } catch {
      showToast("Não foi possível carregar seus grupos");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleCreate() {
    if (name.trim().length === 0) return;
    setBusy(true);
    try {
      const g = await groupsService.create(name.trim());
      setName("");
      router.push(`/group/${g.id}`);
    } catch {
      showToast("Erro ao criar grupo");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (code.trim().length === 0) return;
    setBusy(true);
    try {
      const g = await groupsService.join(code.trim().toUpperCase());
      setCode("");
      router.push(`/group/${g.id}`);
    } catch (e: any) {
      const status = e?.response?.status;
      showToast(
        status === 404
          ? "Código inválido"
          : status === 409
            ? "Você já está nesse grupo"
            : "Erro ao entrar no grupo"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <ScrollView
        className="flex-1 px-md"
        contentContainerClassName="pb-[112px]"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={load} tintColor="#c8a3ff" />
        }
      >
        <Text className="text-headline-mobile text-on-surface font-bold mt-md mb-lg">
          Grupos
        </Text>

        <View className="bg-surface-container rounded-xl p-md gap-md mb-lg">
          <Input
            label="Criar novo grupo"
            placeholder="Nome do grupo"
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
          <Button label="Criar grupo" onPress={handleCreate} loading={busy} fullWidth />
        </View>

        <View className="bg-surface-container rounded-xl p-md gap-md mb-lg">
          <Input
            label="Entrar por código"
            placeholder="Ex: K7M2PQ"
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
            maxLength={12}
          />
          <Button
            label="Entrar"
            variant="secondary"
            onPress={handleJoin}
            loading={busy}
            fullWidth
          />
        </View>

        {loading ? (
          <ActivityIndicator className="mt-xl" color="#c8a3ff" />
        ) : groups.length === 0 ? (
          <EmptyState
            icon="⚔️"
            title="Nenhum grupo ainda"
            description="Crie um grupo ou entre com um código para competir com seus amigos."
          />
        ) : (
          <View className="gap-md pb-xl">
            {groups.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => router.push(`/group/${g.id}`)}
                className="bg-surface-container rounded-xl border-l-4 border-secondary p-md"
              >
                <Text className="text-title-md text-on-surface font-bold">
                  {g.name}
                </Text>
                <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant mt-1">
                  Código: {g.invite_code}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
