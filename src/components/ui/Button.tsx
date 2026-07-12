import { Pressable, Text, ActivityIndicator, PressableProps } from "react-native";

type Variant = "default" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizePad: Record<Size, string> = {
  sm: "px-5 py-2.5",
  md: "px-6 py-4",
};

const variantStyles: Record<Variant, { container: string; text: string; spinner: string }> = {
  default: {
    container: "bg-primary active:opacity-80",
    text: "text-on-primary font-semibold",
    spinner: "#DCDCDD", // neutral-50 (on-primary)
  },
  secondary: {
    container: "border border-secondary active:opacity-80",
    text: "text-secondary font-semibold",
    spinner: "#B26CFF", // purple-200 (secondary)
  },
  ghost: {
    container: "active:opacity-60",
    text: "text-on-surface-variant font-semibold",
    spinner: "#908D94", // neutral-200
  },
  destructive: {
    container: "bg-error active:opacity-80",
    text: "text-on-error font-semibold",
    spinner: "#DCDCDD", // neutral-50 (on-error)
  },
};

export function Button({
  label,
  variant = "default",
  size = "md",
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
        rounded ${sizePad[size]}
        ${styles.container}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50" : ""}
      `}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.spinner} />
      ) : (
        <Text className={`text-label-md tracking-widest uppercase ${styles.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}