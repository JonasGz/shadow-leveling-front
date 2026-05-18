import { Pressable, PressableProps, View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  onPress?: PressableProps["onPress"];
}

export function Card({ onPress, className = "", children, ...props }: CardProps) {
  const base =
    "bg-surface-low border border-outline-variant rounded-md p-md";

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-80 ${className}`}>
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