import { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  TriangleAlert,
  Pencil,
  Flame,
  Trophy,
  ChevronRight,
  LogOut,
} from "lucide-react-native";
import { Button } from "../../src/components/ui/Button";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useToast } from "../../src/components/ui/Toast";
import { pickImage } from "../../src/lib/pickImage";
import { authService } from "../../src/services/auth.service";
import { useAuthStore } from "../../src/stores/auth.store";
import type { User, UserLevel } from "../../src/types/api.types";

// Espaçamento das labels em caixa alta: o design system zera todo tracking-*,
// então o valor do mock vem inline.
const TRACK = { letterSpacing: 0.5 };

function fmtSince(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function ProfileScreen() {
  const { showToast } = useToast();
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clear);

  const [user, setLocalUser] = useState<User | null>(storeUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [editing, setEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNick, setSavingNick] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [me, lvl] = await Promise.all([
        authService.me(),
        // /me/level é secundário: se falhar, perfil ainda carrega
        authService.level().catch(() => null),
      ]);
      setLocalUser(me);
      setUser(me);
      setLevel(lvl);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function confirmLogout() {
    Alert.alert("Sair da conta?", "Você precisará entrar novamente.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await authService.logout();
          } catch {
            // mesmo se o logout remoto falhar, limpamos local
          } finally {
            clearAuth();
            setLoggingOut(false);
            router.replace("/(auth)/login");
          }
        },
      },
    ]);
  }

  const email = user?.email ?? storeUser?.email ?? "—";
  const initial = (email[0] ?? "?").toUpperCase();
  // Prioriza o nickname; fallback ao nome derivado do e-mail (auto-gerado).
  const generatedName =
    email !== "—" ? email.split("@")[0].replace(/[._-]/g, " ") : "Caçador";
  const displayName = user?.nickname?.trim() || generatedName;

  async function changeAvatar() {
    const uri = await pickImage();
    if (!uri) return;
    setUploadingAvatar(true);
    try {
      const updated = await authService.updateAvatar(uri);
      setLocalUser(updated);
      setUser(updated);
      showToast("Foto de perfil atualizada.", "success");
    } catch (err: any) {
      const st = err?.response?.status;
      showToast(
        st === 400
          ? "Imagem inválida. Use JPEG ou PNG de até 5MB."
          : st === 429
            ? "Muitos uploads. Tente novamente em instantes."
            : "Erro ao enviar a foto.",
        "error",
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  function openNicknameEditor() {
    setNicknameInput(user?.nickname ?? "");
    setEditing(true);
  }

  async function saveNickname() {
    const value = nicknameInput.trim();
    if (value.length < 2 || value.length > 30) {
      showToast("O nick deve ter entre 2 e 30 caracteres.", "warning");
      return;
    }
    setSavingNick(true);
    try {
      const updated = await authService.updateNickname(value);
      setLocalUser(updated);
      setUser(updated);
      setEditing(false);
      showToast("Nick atualizado.", "success");
    } catch (err: any) {
      const st = err?.response?.status;
      showToast(
        st === 400
          ? "Nick inválido. Use entre 2 e 30 caracteres."
          : "Erro ao atualizar o nick.",
        "error",
      );
    } finally {
      setSavingNick(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-5 pt-2 pb-[112px]"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#c8a3ff"
          />
        }
      >
        {/* Header */}
        <Text className="text-title-xxl font-bold text-on-surface mt-2">
          Perfil
        </Text>

        {loading ? (
          <View className="items-center justify-center py-xl">
            <ActivityIndicator size="large" color="#c8a3ff" />
          </View>
        ) : error ? (
          <View className="items-center justify-center py-xl gap-md">
            <EmptyState
              icon={TriangleAlert}
              title="Não foi possível carregar o perfil"
              description="Verifique sua conexão e tente novamente."
            />
            <Button
              label="Tentar novamente"
              size="sm"
              onPress={() => {
                setLoading(true);
                load();
              }}
            />
          </View>
        ) : (
          <>
            {/* Avatar + identidade */}
            <View className="items-center mt-5">
              <View className="relative">
                <View
                  className="w-[88px] h-[88px] rounded-full p-[3px]"
                  style={{
                    shadowColor: "#9F1FFF",
                    shadowOpacity: 0.45,
                    shadowRadius: 22,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  <LinearGradient
                    colors={["#9F1FFF", "#6E00B3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 9999,
                    }}
                  />
                  <View className="w-full h-full rounded-full bg-surface-high items-center justify-center overflow-hidden">
                    {user?.avatar_url ? (
                      <Image
                        source={{ uri: user.avatar_url }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-title-xxl font-extrabold text-on-surface">
                        {initial}
                      </Text>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={changeAvatar}
                  disabled={uploadingAvatar}
                  className="absolute -right-0.5 -bottom-0.5 w-[30px] h-[30px] rounded-full bg-primary border-[3px] border-background items-center justify-center active:opacity-80"
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Pencil size={14} color="#fff" strokeWidth={2} />
                  )}
                </Pressable>
              </View>

              <Pressable
                onPress={openNicknameEditor}
                className="flex-row items-center gap-2 mt-3.5 active:opacity-70"
              >
                <Text className="text-title-lg font-bold text-on-surface capitalize">
                  {displayName}
                </Text>
                <Pencil size={14} color="#B26CFF" strokeWidth={2} />
              </Pressable>

              <Text className="text-body-md text-on-surface-variant mt-1.5">
                {email}
              </Text>

              {user?.created_at ? (
                <View className="mt-3 px-3.5 py-1.5 rounded-full border border-white/10">
                  <Text
                    className="text-label-sm font-semibold uppercase text-on-surface-variant"
                    style={TRACK}
                  >
                    Caçador desde {fmtSince(user.created_at)}
                  </Text>
                </View>
              ) : null}
            </View>

            {level ? (
              <>
                {/* Rank / Nível */}
                <View className="flex-row gap-3 mt-5">
                  <View className="flex-1 bg-surface-low border border-card-border rounded-2xl p-4 items-center">
                    <Text
                      className="text-label-sm font-semibold uppercase text-on-surface-variant"
                      style={TRACK}
                    >
                      Rank
                    </Text>
                    <Text className="text-title-xl font-extrabold text-secondary mt-3">
                      {level.rank}
                    </Text>
                  </View>
                  <View className="flex-1 bg-surface-low border border-card-border rounded-2xl p-4 items-center">
                    <Text
                      className="text-label-sm font-semibold uppercase text-on-surface-variant"
                      style={TRACK}
                    >
                      Nível
                    </Text>
                    <Text className="text-title-xl font-extrabold text-secondary mt-3">
                      {level.level}
                    </Text>
                  </View>
                </View>

                {/* Progresso do nível */}
                <View className="bg-surface-low border border-card-border rounded-2xl p-6 mt-3">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-label-sm font-semibold uppercase text-on-surface-variant"
                      style={TRACK}
                    >
                      Progresso do nível
                    </Text>
                    <Text className="text-label-md font-bold text-secondary">
                      {level.xp_into_level} / {level.xp_for_next_level} XP
                    </Text>
                  </View>

                  <View className="h-3 w-full bg-surface-high rounded-full overflow-hidden mt-3">
                    <LinearGradient
                      colors={["#6E00B3", "#9F1FFF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(100, level.progress_pct))}%`,
                        borderRadius: 9999,
                      }}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-3">
                    <Text className="text-label-md text-outline-variant">
                      {level.total_xp.toLocaleString("pt-BR")} XP total
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <Flame size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text className="text-label-md font-bold text-warning">
                        {level.current_streak}{" "}
                        {level.current_streak === 1 ? "dia" : "dias"} de streak
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : null}

            {/* Menu */}
            <View className="bg-surface-low border border-card-border rounded-xl mt-3 overflow-hidden">
              <Pressable
                onPress={() => showToast("Conquistas — em breve.", "info")}
                className="flex-row items-center gap-3 px-5 py-4 active:opacity-70"
              >
                <Trophy size={18} color="#B26CFF" strokeWidth={1.9} />
                <Text className="flex-1 text-label-md font-semibold text-on-surface">
                  Conquistas
                </Text>
                <ChevronRight size={17} color="#6C6971" strokeWidth={2} />
              </Pressable>
            </View>

            {/* Sair */}
            <Pressable
              onPress={confirmLogout}
              disabled={loggingOut}
              className="w-full h-[50px] mt-4 rounded-xl border border-error/40 bg-error/10 flex-row items-center justify-center gap-2.5 active:opacity-80"
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <LogOut size={18} color="#EF4444" strokeWidth={2} />
                  <Text
                    className="text-label-md font-semibold text-error"
                    style={TRACK}
                  >
                    Sair
                  </Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Modal de edição do nick */}
      <Modal
        visible={editing}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-black/70 items-center justify-center px-lg"
        >
          <View className="w-full bg-surface-container border border-outline-variant rounded-xl p-lg gap-md">
            <Text className="text-title-md text-on-surface font-bold">
              Editar nick
            </Text>
            <Text className="text-label-sm text-on-surface-variant">
              Como você quer ser chamado? (2 a 30 caracteres)
            </Text>
            <TextInput
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder={generatedName}
              placeholderTextColor="#958ea0"
              maxLength={30}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-surface-low border border-[#FFFFFF1F] rounded-xl px-md py-3 text-on-surface text-body-lg"
            />
            <View className="flex-row gap-md mt-sm">
              <Pressable
                onPress={() => setEditing(false)}
                disabled={savingNick}
                className="flex-1 rounded-lg border border-outline-variant py-3 items-center active:opacity-70"
              >
                <Text className="text-on-surface-variant text-label-md uppercase">
                  Cancelar
                </Text>
              </Pressable>
              <View className="flex-1">
                <Button
                  label="Salvar"
                  size="sm"
                  fullWidth
                  loading={savingNick}
                  onPress={saveNickname}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
