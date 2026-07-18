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
    <View className="items-center rounded-2xl border border-dashed border-[#FFFFFF24] bg-surface-low p-lg">
      <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-surface-highest">
        <Icon size={26} color="#6C6971" strokeWidth={1.6} />
      </View>
      <Text className="mt-3 text-center text-title-md font-bold text-[#ECECEE]">
        {title}
      </Text>
      {description ? (
        <Text className="mt-1.5 text-center text-body-md text-on-surface-variant">
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
