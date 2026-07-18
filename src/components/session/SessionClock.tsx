import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Clock from "lucide-react-native/icons/clock";
import { formatDuration } from "../../lib/date";
import { color } from "../../theme/palette";

interface SessionClockProps {
  /** Começa a contar quando a sessão existe. */
  running: boolean;
}

/**
 * Cronômetro da sessão.
 *
 * O tick de 1s mora aqui de propósito: enquanto o `elapsed` era estado da tela
 * de sessão, cada segundo re-renderizava o pager e todas as linhas de série.
 * Agora só este texto atualiza.
 */
export function SessionClock({ running }: SessionClockProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  return (
    <View className="mt-1 flex-row items-center gap-1">
      <Clock size={15} color={color["gray-200"]} />
      <Text className="text-label-md text-gray-200">
        {formatDuration(elapsed)}
      </Text>
    </View>
  );
}
