import { Pressable, PressableProps, View, ViewProps } from "react-native";

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
  const base = `bg-surface-low border border-outline-variant rounded-md p-md ${variantStyles[variant]}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${base} active:opacity-80 ${className}`}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View {...props} className={`${base} ${className}`}>
      {children}
    </View>
  );
}
