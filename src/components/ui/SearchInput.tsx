import { useState } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import Search from "lucide-react-native/icons/search";
import { FOCUS_RING } from "./Input";

interface SearchInputProps extends TextInputProps {
  error?: string;
}

export function SearchInput({ error, ...props }: SearchInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-1.5">
      <View
        style={focused && !error ? FOCUS_RING : undefined}
        className={`bg-surface-low border rounded-xl px-5 py-4 flex-row items-center gap-sm ${
          error ? "border-error" : focused ? "border-primary" : "border-[#FFFFFF1F]"
        }`}
      >
        <Search size={20} color="#6c6971" />
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
          placeholderTextColor="#6c6971"
          style={{ fontSize: 18, lineHeight: 20, includeFontPadding: false }}
          className="flex-1 text-body-md text-on-surface"
        />
      </View>
      {error && <Text className="text-label-sm text-error">{error}</Text>}
    </View>
  );
}
