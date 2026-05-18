import { Text, View } from "react-native";

type Tone = "primary" | "secondary" | "tertiary" | "success" | "error" | "neutral";

interface BadgeProps {
  label: string;
  tone?: Tone;
}

const toneStyles: Record<Tone, { container: string; text: string }> = {
  primary: { container: "bg-primary/15", text: "text-primary" },
  secondary: { container: "bg-secondary/15", text: "text-secondary" },
  tertiary: { container: "bg-tertiary/15", text: "text-tertiary" },
  success: { container: "bg-difficulty-easy/15", text: "text-difficulty-easy" },
  error: { container: "bg-error/15", text: "text-error" },
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