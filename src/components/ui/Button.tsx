import { Pressable, Text, ActivityIndicator, PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: "bg-primary active:opacity-80",
    text: "text-on-primary font-semibold",
  },
  secondary: {
    container: "border border-secondary active:opacity-80",
    text: "text-secondary font-semibold",
  },
  ghost: {
    container: "active:opacity-60",
    text: "text-on-surface-variant font-semibold",
  },
  danger: {
    container: "bg-error-container active:opacity-80",
    text: "text-error font-semibold",
  },
};

export function Button({
  label,
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      className={`
        flex-row items-center justify-center
        rounded px-6 py-4
        ${styles.container}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50" : ""}
      `}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "primary" ? "#e4d5ff" : "#c8a3ff"} />
      ) : (
        <Text className={`text-label-md tracking-widest uppercase ${styles.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}
