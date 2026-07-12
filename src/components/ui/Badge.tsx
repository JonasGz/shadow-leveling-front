import { Text, View } from "react-native";

// Semantic PULSE tones. `primary`/`secondary` use the accent ramp; the rest use
// the semantic colours (success/warning/error/info). `neutral` is for status
// that has no semantic weight.
type Tone = "primary" | "secondary" | "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  label: string;
  tone?: Tone;
}

const toneStyles: Record<Tone, { container: string; text: string }> = {
  primary: { container: "bg-primary/15", text: "text-primary" },
  secondary: { container: "bg-secondary/15", text: "text-secondary" },
  success: { container: "bg-success/15", text: "text-success" },
  warning: { container: "bg-warning/15", text: "text-warning" },
  error: { container: "bg-error/15", text: "text-error" },
  info: { container: "bg-info/15", text: "text-info" },
  neutral: { container: "bg-surface-high", text: "text-on-surface-variant" },
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const styles = toneStyles[tone];
  return (
    <View className={`rounded-full px-2.5 py-1 ${styles.container}`}>
      <Text className={`text-label-sm uppercase tracking-widest ${styles.text}`}>
        {label}
      </Text>
    </View>
  );
}