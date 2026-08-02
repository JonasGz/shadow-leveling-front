import { useState } from "react";
import { View, Text, TextInput, TextInputProps, Pressable } from "react-native";
import { color } from "../../theme/palette";
import { cn } from "../../lib/cn";

type LabelSize = "sm" | "md" | "lg";
type Size = "md" | "lg";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  centeredLabel?: boolean;
  labelSize?: LabelSize;
  size?: Size;
}

const sizes: Record<Size, string> = {
  md: "px-4 py-3",
  lg: "px-5 py-5",
};

const labelSizes: Record<LabelSize, string> = {
  sm: "text-xs font-medium",
  md: "text-base font-semibold",
  lg: "text-base font-normal",
};

export const FOCUS_RING = {
  boxShadow: "0px 0px 0px 3px rgba(129, 19, 211, 0.25)",
};

export function controlBorder(focused: boolean, error?: string) {
  if (error) return "border-error";
  return focused ? "border-purple-300" : "border-white/7";
}

export function Input({
  label,
  error,
  secureToggle = false,
  centeredLabel = false,
  labelSize = "sm",
  size = "lg",
  secureTextEntry,
  ...props
}: InputProps) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-2">
      {label && (
        <Text
          className={cn(
            labelSizes[labelSize],
            "uppercase text-gray-200",
            centeredLabel && "text-center",
          )}
        >
          {label}
        </Text>
      )}
      <View className="relative">
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
          secureTextEntry={hidden}
          textContentType={
            secureTextEntry ? "oneTimeCode" : props.textContentType
          }
          autoComplete={secureTextEntry ? "off" : props.autoComplete}
          passwordRules=""
          placeholderTextColor={color["gray-400"]}
          style={[
            { fontSize: 16, lineHeight: 20, includeFontPadding: false },
            focused && !error ? FOCUS_RING : null,
          ]}
          className={cn(
            "w-full rounded-lg border bg-gray-600 text-base font-normal text-white",
            sizes[size],
            controlBorder(focused, error),
          )}
        />
        {secureToggle && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            className="absolute bottom-0 right-4 top-0 justify-center"
          >
            <Text className="text-xs font-medium text-gray-200">
              {hidden ? "MOSTRAR" : "OCULTAR"}
            </Text>
          </Pressable>
        )}
      </View>
      {error && <Text className="text-xs font-medium text-error">{error}</Text>}
    </View>
  );
}
