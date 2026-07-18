import { Pressable, PressableProps } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { color } from "../../theme/palette";
import { cn } from "../../lib/cn";

type Variant = "outline" | "primary";

interface IconButtonProps extends PressableProps {
  icon: LucideIcon;
  variant?: Variant;
  size?: number;
}

const PRIMARY_SHADOW = { boxShadow: "0px 4px 14px rgba(129, 19, 211, 0.35)" };

export function IconButton({
  icon: Icon,
  variant = "outline",
  size = 20,
  ...props
}: IconButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      {...props}
      style={isPrimary ? PRIMARY_SHADOW : undefined}
      className={cn(
        "rounded-lg items-center justify-center self-center p-3 active:opacity-70",
        isPrimary ? "bg-purple-300" : "border border-white/12",
      )}
    >
      <Icon
        size={size}
        color={isPrimary ? color.white : color["gray-50"]}
        fill={isPrimary ? color.white : "none"}
      />
    </Pressable>
  );
}
