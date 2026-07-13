import { Pressable, PressableProps } from "react-native";
import type { LucideIcon } from "lucide-react-native";

type Variant = "outline" | "primary";

interface IconButtonProps extends PressableProps {
  icon: LucideIcon;
  variant?: Variant;
  size?: number;
}

const PRIMARY_SHADOW = { boxShadow: "0px 4px 14px rgba(159, 31, 255, 0.35)" };

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
      className={`self-center p-3 rounded-[10px] items-center justify-center active:opacity-70 ${
        isPrimary ? "bg-primary" : "border border-[#FFFFFF24]"
      }`}
    >
      <Icon
        size={size}
        color={isPrimary ? "#FFF" : "#ECECEE"}
        fill={isPrimary ? "#FFF" : "none"}
      />
    </Pressable>
  );
}
