import { useEffect, useRef } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuthStore } from "../../src/stores/auth.store";
import { useToast } from "../../src/components/ui/Toast";
import { groupsService } from "../../src/services/groups.service";
import { setPendingInvite } from "../../src/lib/invite";
import { color } from "../../src/theme/palette";

export default function JoinGroupScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || !code) return;
    handled.current = true;

    if (!user) {
      setPendingInvite(code).finally(() => router.replace("/(auth)/welcome"));
      return;
    }

    (async () => {
      try {
        const g = await groupsService.join(code.toUpperCase());
        router.replace(`/group/${g.id}`);
      } catch (e: any) {
        const status = e?.response?.status;
        showToast(
          status === 404
            ? "Código de convite inválido"
            : status === 409
              ? "Você já está nesse grupo"
              : "Não foi possível entrar no grupo",
        );
        router.replace("/(tabs)/groups");
      }
    })();
  }, [code, user, showToast]);

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-gray-700">
      <ActivityIndicator color={color["purple-100"]} />
      <Text className="text-base font-semibold text-gray-200">
        Entrando no grupo…
      </Text>
    </View>
  );
}
