import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import type { LucideIcon } from "lucide-react-native";

type Variant = "default" | "tonal" | "ghost" | "destructive";
type Size = "sm" | "md";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  labelClassName?: string;
  // Text-casing of the label. Defaults to uppercase (existing behavior). Pass
  // "capitalize"/"none" to opt out. Weight is controlled via labelClassName
  // (e.g. labelClassName="font-bold").
  transform?: "uppercase" | "capitalize" | "none";
}

const sizePad: Record<Size, string> = {
  sm: "px-5 py-2.5",
  md: "px-6 py-5",
};

const variantStyles: Record<
  Variant,
  { container: string; text: string; icon: string; spinner: string }
> = {
  default: {
    container: "bg-primary active:opacity-80",
    text: "text-on-primary font-semibold",
    icon: "#FFF",
    spinner: "#DCDCDD", // neutral-50 (on-primary)
  },
  tonal: {
    container: "bg-[#9F1FFF1F] active:opacity-80",
    text: "text-[#CAA4FF] font-semibold",
    icon: "#CAA4FF", // purple-100
    spinner: "#CAA4FF",
  },
  ghost: {
    container: "active:opacity-60",
    text: "text-on-surface-variant font-semibold",
    icon: "#908D94",
    spinner: "#908D94", // neutral-200
  },
  destructive: {
    container: "bg-error active:opacity-80",
    text: "text-on-error font-semibold",
    icon: "#DCDCDD",
    spinner: "#DCDCDD", // neutral-50 (on-error)
  },
};

export function Button({
  label,
  variant = "default",
  size = "md",
  icon: Icon,
  loading = false,
  fullWidth = false,
  labelClassName = "",
  transform = "uppercase",
  disabled,
  ...props
}: ButtonProps) {
  const transformClass = transform === "none" ? "" : transform;
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;
  // NativeWind doesn't reliably last-wins two conflicting text-<size> classes,
  // so only apply the default size when labelClassName doesn't set its own.
  const sizeClass = /(^|\s)text-(label|body|title|display|subtitle|button|caption|h[123])/.test(
    labelClassName,
  )
    ? ""
    : "text-label-md";

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      className={`
        flex-row items-center justify-center gap-2
        rounded-lg ${sizePad[size]}
        ${styles.container}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50" : ""}
      `}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.spinner} />
      ) : (
        <>
          {Icon && <Icon size={20} color={styles.icon} fill={styles.icon} />}
          <Text
            className={`${sizeClass} ${transformClass} ${styles.text} ${labelClassName}`}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
