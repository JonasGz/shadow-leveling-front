import { Pressable, PressableProps, View, ViewProps } from "react-native";
import { cn } from "../../lib/cn";

type Variant = "flat" | "default" | "raised";

interface CardProps extends ViewProps {
  onPress?: PressableProps["onPress"];
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  flat: "",
  // ponytail: nativewind maps shadow-low/medium/high to native elevation.
  default: "shadow-low",
  raised: "shadow-medium",
};

export function Card({
  onPress,
  variant = "default",
  className = "",
  children,
  ...props
}: CardProps) {
  // className vem por último para vencer a base no merge.
  const base = cn(
    "rounded-2xl border border-white/7 bg-gray-600 p-4",
    variantStyles[variant],
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cn(base, "active:opacity-80", className)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View {...props} className={cn(base, className)}>
      {children}
    </View>
  );
}
