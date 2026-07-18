import { useState } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import Search from "lucide-react-native/icons/search";
import { FOCUS_RING, controlBorder } from "./Input";
import { color } from "../../theme/palette";
import { cn } from "../../lib/cn";

interface SearchInputProps extends TextInputProps {
  error?: string;
}

export function SearchInput({ error, ...props }: SearchInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-1.5">
      <View
        style={focused && !error ? FOCUS_RING : undefined}
        className={cn(
          "flex-row items-center gap-sm rounded-lg border bg-gray-600 px-5 py-4",
          controlBorder(focused, error),
        )}
      >
        <Search size={20} color={color["gray-300"]} />
        <TextInput
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={color["gray-300"]}
          style={{ fontSize: 18, lineHeight: 20, includeFontPadding: false }}
          className="flex-1 text-body-md text-white"
        />
      </View>
      {error && <Text className="text-label-sm text-error">{error}</Text>}
    </View>
  );
}
