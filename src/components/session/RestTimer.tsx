import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Timer from "lucide-react-native/icons/timer";
import Plus from "lucide-react-native/icons/plus";
import X from "lucide-react-native/icons/x";
import { formatDuration } from "../../lib/date";

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
      className="absolute bottom-8 self-center bg-surface-high border border-secondary/40 rounded-2xl pl-3 pr-2.5 py-2.5 flex-row items-center gap-3"
      style={{
        left: 0,
        right: 0,
        marginHorizontal: "auto",
        maxWidth: 300,
        boxShadow: "0px 8px 28px rgba(0, 0, 0, 0.55)",
      }}
    >
      <LinearGradient
        colors={["#8113D3", "#6E00B3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0.87 }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0px 0px 14px rgba(129, 19, 211, 0.5)",
        }}
      >
        <Timer size={20} color="#FFF" />
      </LinearGradient>
      <View className="flex-1">
        <Text className="text-label-sm text-on-surface-variant uppercase tracking-widest font-bold">
          Descanso
        </Text>
        <Text className="text-title-md text-secondary font-bold leading-none mt-0.5">
          {formatDuration(remaining)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adicionar 15 segundos ao descanso"
        onPress={() => setRemaining((r) => r + 15)}
        className="bg-surface-lowest w-9 h-9 rounded-xl items-center justify-center border border-secondary/25 active:opacity-70"
      >
        <Plus size={16} color="#B26CFF" strokeWidth={2.5} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Encerrar descanso"
        onPress={onDismiss}
        className="bg-surface-lowest w-9 h-9 rounded-xl items-center justify-center border border-secondary/25 active:opacity-70"
      >
        <X size={16} color="#B26CFF" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
