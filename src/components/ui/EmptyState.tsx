import { Text, View } from "react-native";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "./Button";
import { color } from "../../theme/palette";

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
    <View className="items-center rounded-2xl border border-dashed border-white/12 bg-gray-600 p-6">
      <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-gray-500">
        <Icon size={26} color={color["gray-300"]} strokeWidth={1.6} />
      </View>
      <Text className="mt-3 text-center text-title-md font-bold text-gray-50">
        {title}
      </Text>
      {description ? (
        <Text className="mt-2 text-center text-body-md text-gray-200">
          {description}
        </Text>
      ) : null}
      {action ? (
        <View className="mt-4">
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
