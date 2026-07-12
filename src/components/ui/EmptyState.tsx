import { Text, View } from "react-native";
import { TriangleAlert, type LucideIcon } from "lucide-react-native";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon = TriangleAlert, title, description }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-lg py-xl gap-2">
      <Icon size={48} color="#908D94" strokeWidth={1.5} />
      <Text className="text-title-md text-on-surface font-semibold text-center mt-2">
        {title}
      </Text>
      {description ? (
        <Text className="text-body-md text-on-surface-variant text-center">
          {description}
        </Text>
      ) : null}
    </View>
  );
}