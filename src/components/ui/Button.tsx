import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { color } from "../../theme/palette";
import { cn } from "../../lib/cn";

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
  sm: "px-5 py-3",
  md: "px-6 py-5",
};

const variantStyles: Record<
  Variant,
  { container: string; text: string; icon: string; spinner: string }
> = {
  default: {
    container: "bg-purple-300 active:opacity-80",
    text: "text-gray-50 font-semibold",
    icon: color.white,
    spinner: color["gray-50"], // neutral-50 (on-primary)
  },
  tonal: {
    container: "bg-purple-300/12 active:opacity-80",
    text: "text-purple-100 font-semibold",
    icon: color["purple-100"], // purple-100
    spinner: color["purple-100"],
  },
  ghost: {
    container: "active:opacity-60",
    text: "text-gray-200 font-semibold",
    icon: color["gray-200"],
    spinner: color["gray-200"], // neutral-200
  },
  destructive: {
    container: "bg-error active:opacity-80",
    text: "text-gray-50 font-semibold",
    icon: color["gray-50"],
    spinner: color["gray-50"], // neutral-50 (on-error)
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
  className,
  ...props
}: ButtonProps) {
  const transformClass = transform === "none" ? "" : transform;
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-lg",
        sizePad[size],
        styles.container,
        fullWidth && "w-full",
        isDisabled && "opacity-50",
        // por último: quem chama vence a base.
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.spinner} />
      ) : (
        <>
          {Icon && <Icon size={20} color={styles.icon} fill={styles.icon} />}
          {/* text-label-md é o padrão; um text-* vindo em labelClassName vence
              pelo merge, sem precisar detectá-lo antes. */}
          <Text
            className={cn(
              "text-label-md",
              transformClass,
              styles.text,
              labelClassName,
            )}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
