import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Timer from "lucide-react-native/icons/timer";
import Plus from "lucide-react-native/icons/plus";
import X from "lucide-react-native/icons/x";
import { formatDuration } from "../../lib/date";
import { color } from "../../theme/palette";

interface RestTimerProps {
  /** Segundos iniciais da contagem. */
  seconds: number;
  /** Chamado ao zerar ou ao tocar no X. */
  onDismiss: () => void;
}

/**
 * Timer de descanso flutuante. Dono da própria contagem — o tick não sobe
 * para a tela de sessão.
 *
 * A tela remonta este componente via `key` a cada nova série concluída, então
 * a contagem reinicia sem precisar de estado sincronizado nos dois lados.
 */
export function RestTimer({ seconds, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  // Um único intervalo para toda a contagem: o encadeamento de setTimeout por
  // tick reagendava a cada render e acumulava atraso.
  useEffect(() => {
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remaining <= 0) onDismiss();
  }, [remaining, onDismiss]);

  return (
    <View
      className="absolute bottom-8 flex-row items-center gap-3 self-center rounded-2xl border border-purple-200/40 bg-gray-500 py-3 pl-3 pr-3"
      style={{
        left: 0,
        right: 0,
        marginHorizontal: "auto",
        maxWidth: 300,
        boxShadow: "0px 8px 28px rgba(0, 0, 0, 0.55)",
      }}
    >
      <LinearGradient
        colors={[color["purple-300"], color["purple-400"]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0.87 }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12, // rounded-lg (controle)
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0px 0px 14px rgba(129, 19, 211, 0.5)",
        }}
      >
        <Timer size={20} color={color.white} />
      </LinearGradient>
      <View className="flex-1">
        <Text className="text-xs font-bold uppercase text-gray-200">
          Descanso
        </Text>
        <Text className="mt-1 text-xl font-bold leading-none text-purple-200">
          {formatDuration(remaining)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adicionar 15 segundos ao descanso"
        onPress={() => setRemaining((r) => r + 15)}
        className="h-9 w-9 items-center justify-center rounded-lg border border-purple-200/25 bg-gray-700 active:opacity-70"
      >
        <Plus size={16} color={color["purple-200"]} strokeWidth={2.5} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Encerrar descanso"
        onPress={onDismiss}
        className="h-9 w-9 items-center justify-center rounded-lg border border-purple-200/25 bg-gray-700 active:opacity-70"
      >
        <X size={16} color={color["purple-200"]} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
