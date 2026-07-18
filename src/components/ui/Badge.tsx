import { Text, View } from "react-native";
import { cn } from "../../lib/cn";

// Semantic PULSE tones. `primary`/`secondary` use the accent ramp; the rest use
// the semantic colours (success/warning/error/info). `neutral` is for status
// that has no semantic weight.
type Tone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

interface BadgeProps {
  label: string;
  tone?: Tone;
}

const toneStyles: Record<Tone, { container: string; text: string }> = {
  primary: {
    container: "bg-purple-300/15 border border-purple-300/35",
    text: "text-purple-300",
  },
  secondary: {
    container: "bg-purple-200/15 border border-purple-200/35",
    text: "text-purple-200",
  },
  success: {
    container: "bg-success/15 border border-success/35",
    text: "text-success",
  },
  warning: {
    container: "bg-warning/15 border border-warning/35",
    text: "text-warning",
  },
  error: {
    container: "bg-error/15 border border-error/35",
    text: "text-error",
  },
  info: { container: "bg-info/15 border border-info/35", text: "text-info" },
  neutral: {
    container: "bg-gray-500 border border-gray-400/40",
    text: "text-gray-200",
  },
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const styles = toneStyles[tone];
  return (
    <View className={cn("rounded-full px-3 py-1", styles.container)}>
      <Text
        className={cn("text-label-sm uppercase tracking-widest", styles.text)}
      >
        {label}
      </Text>
    </View>
  );
}
