import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Clock from "lucide-react-native/icons/clock";
import { formatDuration } from "../../lib/date";
import { color } from "../../theme/palette";

interface SessionClockProps {
  running: boolean;
}

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
      <Text className="text-base font-semibold text-gray-200">
        {formatDuration(elapsed)}
      </Text>
    </View>
  );
}
