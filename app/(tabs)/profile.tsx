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
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Pencil from "lucide-react-native/icons/pencil";
import Flame from "lucide-react-native/icons/flame";
import Trophy from "lucide-react-native/icons/trophy";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import LogOut from "lucide-react-native/icons/log-out";
import Target from "lucide-react-native/icons/target";
import { Button } from "../../src/components/ui/Button";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useToast } from "../../src/components/ui/Toast";
import { WeeklyGoalModal } from "../../src/components/WeeklyGoalModal";
import { formatDateSlash } from "../../src/lib/date";
import { pickImage } from "../../src/lib/pickImage";
import { authService } from "../../src/services/auth.service";
import { useAuthStore } from "../../src/stores/auth.store";
import type { User, UserLevel } from "../../src/types/api.types";
import { color } from "../../src/theme/palette";
import { Card } from "../../src/components/ui/Card";

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
  const [goalModalVisible, setGoalModalVisible] = useState(false);
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
    <SafeAreaView className="flex-1 bg-gray-700" edges={["top"]}>
      <ScrollView
        contentContainerClassName="px-5 pt-2 pb-[112px]"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={color["purple-100"]}
          />
        }
      >
        {/* Header */}
        <Text className="mt-2 text-4xl font-bold text-white">Perfil</Text>

        {loading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color={color["purple-100"]} />
          </View>
        ) : error ? (
          <View className="items-center justify-center gap-4 py-10">
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
            <View className="mt-5 items-center">
              <View className="relative">
                <View
                  className="h-[88px] w-[88px] rounded-full p-[3px]"
                  style={{
                    shadowColor: color["purple-300"],
                    shadowOpacity: 0.45,
                    shadowRadius: 22,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  <LinearGradient
                    colors={[color["purple-300"], color["purple-400"]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 9999,
                    }}
                  />
                  <View className="h-full w-full items-center justify-center overflow-hidden rounded-full bg-gray-500">
                    {user?.avatar_url ? (
                      <Image
                        source={{ uri: user.avatar_url }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-4xl font-extrabold text-white">
                        {initial}
                      </Text>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={changeAvatar}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-0.5 -right-0.5 h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-gray-700 bg-purple-300 active:opacity-80"
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color={color.white} />
                  ) : (
                    <Pencil size={14} color={color.white} strokeWidth={2} />
                  )}
                </Pressable>
              </View>

              <Pressable
                onPress={openNicknameEditor}
                className="mt-4 flex-row items-center gap-2 active:opacity-70"
              >
                {/* shrink + 1 linha: sem isso um nome longo empurra o lápis
                    para fora da tela em 320px, porque Text não encolhe. */}
                <Text
                  numberOfLines={1}
                  className="shrink text-2xl font-bold capitalize text-white"
                >
                  {displayName}
                </Text>
                <Pencil size={14} color={color["purple-200"]} strokeWidth={2} />
              </Pressable>

              <Text className="mt-2 text-base font-normal text-gray-200">
                {email}
              </Text>

              {user?.created_at ? (
                <View className="mt-3 rounded-full border border-white/12 px-4 py-2">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                    Caçador desde {formatDateSlash(user.created_at)}
                  </Text>
                </View>
              ) : null}
            </View>

            {level ? (
              <>
                {/* Rank / Nível */}
                <View className="mt-5 flex-row gap-3">
                  <Card className="flex-1 items-center">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                      Rank
                    </Text>
                    <Text className="mt-3 text-3xl font-extrabold text-purple-200">
                      {level.rank}
                    </Text>
                  </Card>
                  <Card className="flex-1 items-center">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                      Nível
                    </Text>
                    <Text className="mt-3 text-3xl font-extrabold text-purple-200">
                      {level.level}
                    </Text>
                  </Card>
                </View>

                {/* Progresso do nível */}
                <Card className="mt-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-semibold uppercase tracking-wider text-gray-200">
                      Progresso do nível
                    </Text>
                    <Text className="text-base font-bold text-purple-200">
                      {level.xp_into_level} / {level.xp_for_next_level} XP
                    </Text>
                  </View>

                  <View className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-500">
                    <LinearGradient
                      colors={[color["purple-400"], color["purple-300"]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(100, level.progress_pct))}%`,
                        borderRadius: 9999,
                      }}
                    />
                  </View>

                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-gray-300">
                      {level.total_xp.toLocaleString("pt-BR")} XP total
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Flame
                        size={14}
                        color={color.warning}
                        fill={color.warning}
                      />
                      <Text className="text-base font-bold text-warning">
                        {level.current_streak}{" "}
                        {level.current_streak === 1 ? "dia" : "dias"} de streak
                      </Text>
                    </View>
                  </View>
                </Card>
              </>
            ) : null}

            {/* Menu */}
            <Card className="mt-3 overflow-hidden p-0">
              <Pressable
                onPress={() => setGoalModalVisible(true)}
                className="flex-row items-center gap-3 px-5 py-4 active:opacity-70"
              >
                <Target
                  size={18}
                  color={color["purple-200"]}
                  strokeWidth={1.9}
                />
                <Text className="flex-1 text-base font-semibold text-white">
                  Meta semanal
                </Text>
                {user?.weekly_goal_days != null && (
                  <Text className="text-base font-semibold text-gray-200">
                    {user.weekly_goal_days}x
                  </Text>
                )}
                <ChevronRight
                  size={17}
                  color={color["gray-300"]}
                  strokeWidth={2}
                />
              </Pressable>
              <View className="h-px bg-gray-300/40" />
              <Pressable
                onPress={() => showToast("Conquistas — em breve.", "info")}
                className="flex-row items-center gap-3 px-5 py-4 active:opacity-70"
              >
                <Trophy
                  size={18}
                  color={color["purple-200"]}
                  strokeWidth={1.9}
                />
                <Text className="flex-1 text-base font-semibold text-white">
                  Conquistas
                </Text>
                <ChevronRight
                  size={17}
                  color={color["gray-300"]}
                  strokeWidth={2}
                />
              </Pressable>
            </Card>

            {/* Sair */}
            <Pressable
              onPress={confirmLogout}
              disabled={loggingOut}
              className="mt-4 h-[50px] w-full flex-row items-center justify-center gap-3 rounded-lg border border-error/40 bg-error/10 active:opacity-80"
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color={color.error} />
              ) : (
                <>
                  <LogOut size={18} color={color.error} strokeWidth={2} />
                  <Text className="text-base font-semibold tracking-wider text-error">
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
          className="flex-1 items-center justify-center bg-black/70 px-6"
        >
          <View className="w-full gap-4 rounded-2xl border border-gray-300 bg-gray-600 p-6">
            <Text className="text-xl font-bold text-white">Editar nick</Text>
            <Text className="text-xs font-medium text-gray-200">
              Como você quer ser chamado? (2 a 30 caracteres)
            </Text>
            <TextInput
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder={generatedName}
              placeholderTextColor={color["gray-200"]}
              maxLength={30}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              className="rounded-lg border border-white/12 bg-gray-600 px-4 py-3 text-lg font-normal text-white"
            />
            <View className="mt-2 flex-row gap-4">
              <Pressable
                onPress={() => setEditing(false)}
                disabled={savingNick}
                className="flex-1 items-center rounded-lg border border-gray-300 py-3 active:opacity-70"
              >
                <Text className="text-base font-semibold uppercase text-gray-200">
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

      <WeeklyGoalModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onSaved={(updated) => {
          setLocalUser(updated);
          setGoalModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
