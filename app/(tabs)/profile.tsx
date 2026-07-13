import { useCallback, useState } from "react";
import {
  View,
  Text,
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
import { TriangleAlert, Lock } from "lucide-react-native";
import { Button } from "../../src/components/ui/Button";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { useToast } from "../../src/components/ui/Toast";
import { authService } from "../../src/services/auth.service";
import { useAuthStore } from "../../src/stores/auth.store";
import type { Session, User, UserLevel } from "../../src/types/api.types";

function fmtSince(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtSessionDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
  return sameDay ? `Hoje, ${time}` : `${fmtSince(iso)} • ${time}`;
}

function deviceIcon(ua: string) {
  const s = ua.toLowerCase();
  if (/iphone|android|mobile|okhttp|expo/.test(s)) return "📱";
  if (/ipad|tablet/.test(s)) return "🖥";
  if (/windows|mac|linux|chrome|firefox|edge|safari/.test(s)) return "💻";
  return "🔑";
}

function deviceLabel(ua: string) {
  if (!ua || ua.trim() === "") return "Dispositivo desconhecido";
  // user-agents de app costumam ser curtos (okhttp/expo); navegadores são longos
  if (ua.length > 80) return ua.slice(0, 80) + "…";
  return ua;
}

export default function ProfileScreen() {
  const { showToast } = useToast();
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clear);

  const [user, setLocalUser] = useState<User | null>(storeUser);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [editing, setEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNick, setSavingNick] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [me, sess, lvl] = await Promise.all([
        authService.me(),
        authService.sessions(),
        // /me/level é secundário: se falhar, perfil ainda carrega
        authService.level().catch(() => null),
      ]);
      setLocalUser(me);
      setUser(me);
      setLevel(lvl);
      setSessions(
        [...sess].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
      );
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
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function confirmRevoke(session: Session) {
    Alert.alert(
      "Revogar sessão?",
      "Esse dispositivo será desconectado e precisará entrar novamente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Revogar",
          style: "destructive",
          onPress: async () => {
            setRevoking(session.id);
            try {
              await authService.revokeSession(session.id);
              setSessions((prev) =>
                prev.filter((s) => s.id !== session.id)
              );
              showToast("Sessão revogada.", "success");
            } catch (err: any) {
              const st = err?.response?.status;
              showToast(
                st === 404
                  ? "Sessão não encontrada."
                  : "Erro ao revogar sessão.",
                "error"
              );
            } finally {
              setRevoking(null);
            }
          },
        },
      ]
    );
  }

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
        "error"
      );
    } finally {
      setSavingNick(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-md h-16 border-b border-outline-variant">
        <Text className="text-headline-mobile font-black text-primary uppercase">
          Shadow Leveling
        </Text>
        <Pressable className="w-10 h-10 items-center justify-center rounded-full active:opacity-60">
          <Text className="text-primary text-xl">◔</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c8a3ff" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-lg gap-md">
          <EmptyState
            icon={TriangleAlert}
            title="Não foi possível carregar o perfil"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar novamente" size="sm" onPress={() => {
              setLoading(true);
              load();
            }} />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-md py-xl gap-xl pb-[112px]"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#c8a3ff"
            />
          }
        >
          {/* Info do usuário */}
          <View className="items-center gap-md">
            <View className="relative">
              <View
                className="w-32 h-32 rounded-full p-1"
                style={{
                  shadowColor: "#c8a3ff",
                  shadowOpacity: 0.3,
                  shadowRadius: 15,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <LinearGradient
                  colors={["#c8a3ff", "#b06cff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 9999,
                  }}
                />
                <View className="w-full h-full rounded-full bg-surface-high items-center justify-center border-4 border-background">
                  <Text className="text-primary text-5xl font-black">
                    {initial}
                  </Text>
                </View>
              </View>
              {/* Botão editar avatar (UI pronta; back ainda sem endpoint) */}
              <Pressable
                onPress={() =>
                  showToast(
                    "Edição de foto de perfil — em breve.",
                    "warning"
                  )
                }
                className="absolute -bottom-1 -right-1 bg-primary w-9 h-9 rounded-full items-center justify-center border-2 border-background active:opacity-80"
              >
                <Text className="text-on-primary text-base">✎</Text>
              </Pressable>
            </View>

            <View className="items-center gap-1">
              <Pressable
                onPress={openNicknameEditor}
                className="flex-row items-center gap-2 active:opacity-70"
              >
                <Text className="text-headline-mobile text-on-surface capitalize">
                  {displayName}
                </Text>
                <Text className="text-primary text-base">✎</Text>
              </Pressable>
              <Text className="text-body-lg text-on-surface-variant">
                {email}
              </Text>
              {user?.created_at ? (
                <View className="mt-2 px-3 py-1 rounded-full bg-surface-highest border border-outline-variant">
                  <Text className="text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Caçador desde {fmtSince(user.created_at)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Nível / XP / Rank / Streak */}
          {level ? (
            <View className="gap-md">
              <View className="flex-row gap-md">
                <View className="flex-1 bg-surface-low p-md rounded-xl border border-outline-variant items-center">
                  <Text className="text-label-sm text-outline uppercase tracking-widest">
                    Rank
                  </Text>
                  <Text className="text-display-md text-secondary">
                    {level.rank}
                  </Text>
                </View>
                <View className="flex-1 bg-surface-low p-md rounded-xl border border-outline-variant items-center">
                  <Text className="text-label-sm text-outline uppercase tracking-widest">
                    Nível
                  </Text>
                  <Text className="text-display-md text-primary">
                    {level.level}
                  </Text>
                </View>
              </View>

              <View className="bg-surface-low p-md rounded-xl border border-outline-variant gap-sm">
                <View className="flex-row justify-between items-end">
                  <Text className="text-label-sm text-on-surface-variant uppercase tracking-widest">
                    Progresso do nível
                  </Text>
                  <Text className="text-label-sm text-primary">
                    {level.xp_into_level} / {level.xp_for_next_level} XP
                  </Text>
                </View>
                <View className="h-2 w-full bg-surface-highest rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, level.progress_pct))}%`,
                      shadowColor: "#c8a3ff",
                      shadowOpacity: 0.5,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 0 },
                    }}
                  />
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-label-sm text-outline uppercase tracking-widest">
                    {level.total_xp.toLocaleString("pt-BR")} XP total
                  </Text>
                  <Text className="text-label-sm text-tertiary uppercase tracking-widest">
                    🔥 {level.current_streak}{" "}
                    {level.current_streak === 1 ? "dia" : "dias"} de streak
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Sessões ativas */}
          <View className="gap-md">
            <View className="flex-row items-center justify-between border-b border-outline-variant pb-sm">
              <Text className="text-label-md text-primary uppercase tracking-widest">
                🔑 Sessões Ativas
              </Text>
              <Text className="text-label-sm text-outline">
                {sessions.length}{" "}
                {sessions.length === 1 ? "conectado" : "conectados"}
              </Text>
            </View>

            {sessions.length === 0 ? (
              <EmptyState
                icon={Lock}
                title="Nenhuma sessão ativa"
                description="Não há outros dispositivos conectados."
              />
            ) : (
              <View className="gap-sm">
                {sessions.map((s) => (
                  <View
                    key={s.id}
                    className="bg-surface-low p-md rounded-xl border border-outline-variant flex-row items-center justify-between gap-md"
                  >
                    <View className="flex-row items-center gap-md flex-1">
                      <View className="w-10 h-10 rounded-lg bg-surface-highest items-center justify-center">
                        <Text className="text-primary text-lg">
                          {deviceIcon(s.user_agent ?? "")}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-title-md text-on-surface"
                          numberOfLines={1}
                        >
                          {deviceLabel(s.user_agent ?? "")}
                        </Text>
                        <Text className="text-label-sm text-outline">
                          {fmtSessionDate(s.created_at)}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => confirmRevoke(s)}
                      disabled={revoking === s.id}
                      className="px-3 py-2 rounded-lg border border-error/50 active:bg-error/10"
                    >
                      {revoking === s.id ? (
                        <ActivityIndicator size="small" color="#ffb4ab" />
                      ) : (
                        <Text className="text-error text-label-sm uppercase">
                          Revogar
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Ações da conta */}
          <View className="gap-md pt-lg">
            <Pressable
              onPress={confirmLogout}
              disabled={loggingOut}
              className="w-full h-14 bg-error rounded-xl flex-row items-center justify-center gap-2 active:opacity-90"
              style={{
                shadowColor: "#ffb4ab",
                shadowOpacity: 0.2,
                shadowRadius: 15,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color="#690005" />
              ) : (
                <Text className="text-on-error text-label-md uppercase tracking-widest font-semibold">
                  ⎋ Sair
                </Text>
              )}
            </Pressable>
            <Text className="text-center text-label-sm text-outline px-lg">
              Sua sessão neste dispositivo será encerrada.
            </Text>
          </View>
        </ScrollView>
      )}

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
                <Text className="text-on-surface-variant text-label-md uppercase tracking-widest">
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
