import { Text, View } from "react-native";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon = "⚔️", title, description }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-lg py-xl gap-2">
      <Text className="text-5xl mb-2">{icon}</Text>
      <Text className="text-title-md text-on-surface font-semibold text-center">
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