import { Text, View } from "react-native";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({
  icon: Icon = TriangleAlert,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View className="bg-surface-low border border-dashed border-[#FFFFFF24] rounded-2xl p-lg items-center">
      <View className="w-[52px] h-[52px] rounded-full bg-surface-highest items-center justify-center">
        <Icon size={26} color="#6C6971" strokeWidth={1.6} />
      </View>
      <Text className="text-title-md text-[#ECECEE] font-bold text-center mt-3">
        {title}
      </Text>
      {description ? (
        <Text className="text-body-md text-on-surface-variant text-center mt-1.5">
          {description}
        </Text>
      ) : null}
      {action ? (
        <View className="mt-md">
          <Button
            label={action.label}
            variant="tonal"
            size="sm"
            onPress={action.onPress}
          />
        </View>
      ) : null}
    </View>
  );
}
