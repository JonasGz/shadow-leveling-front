import { useState } from "react";
import { View, Text, TextInput, TextInputProps, Pressable } from "react-native";

type LabelSize = "sm" | "md" | "lg";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  secureToggle?: boolean;
  centeredLabel?: boolean;
  labelSize?: LabelSize;
}

const labelSizes: Record<LabelSize, string> = {
  sm: "text-label-sm",
  md: "text-label-md",
  lg: "text-body-md",
};

/** Halo roxo do estado de foco — compartilhado com [SearchInput]. */
export const FOCUS_RING = {
  boxShadow: "0px 0px 0px 3px rgba(159, 31, 255, 0.25)",
};

export function Input({
  label,
  error,
  secureToggle = false,
  centeredLabel = false,
  labelSize = "sm",
  secureTextEntry,
  ...props
}: InputProps) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-1.5">
      <Text
        className={`${labelSizes[labelSize]} uppercase tracking-widest text-on-surface-variant ${
          centeredLabel ? "text-center" : ""
        }`}
      >
        {label}
      </Text>
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
          placeholderTextColor="#49474D" // neutral-400
          style={[
            // O text-body-md traz lineHeight 24 para uma fonte de 16 — no Android
            // essa sobra vai toda para baixo do texto. lineHeight = fontSize
            // (+ includeFontPadding off) deixa o padding vertical centralizar.
            { fontSize: 18, lineHeight: 20, includeFontPadding: false },
            focused && !error ? FOCUS_RING : null,
          ]}
          className={`
            w-full rounded-xl px-5 py-5
            bg-surface-low border
            text-on-surface text-body-md
            ${error ? "border-error" : focused ? "border-primary" : "border-[#FFFFFF1F]"}
          `}
        />
        {secureToggle && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            className="absolute right-4 top-0 bottom-0 justify-center"
          >
            <Text className="text-label-sm text-on-surface-variant">
              {hidden ? "MOSTRAR" : "OCULTAR"}
            </Text>
          </Pressable>
        )}
      </View>
      {error && <Text className="text-label-sm text-error">{error}</Text>}
    </View>
  );
}
