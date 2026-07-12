import { useState } from "react";
import { View, Text, TextInput, TextInputProps, Pressable } from "react-native";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  secureToggle?: boolean;
}

export function Input({ label, error, secureToggle = false, secureTextEntry, ...props }: InputProps) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View className="gap-1.5">
      <Text className="text-label-sm uppercase tracking-widest text-on-surface-variant">{label}</Text>
      <View className="relative">
        <TextInput
          {...props}
          secureTextEntry={hidden}
          textContentType={secureTextEntry ? "oneTimeCode" : props.textContentType}
          autoComplete={secureTextEntry ? "off" : props.autoComplete}
          passwordRules=""
          placeholderTextColor="#49474D" // neutral-400
          className={`
            w-full rounded px-4 py-4
            bg-surface-lowest border
            text-on-surface text-body-md
            ${error ? "border-error" : "border-outline-variant focus:border-primary"}
          `}
        />
        {secureToggle && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            className="absolute right-4 top-0 bottom-0 justify-center"
          >
            <Text className="text-label-sm text-on-surface-variant">{hidden ? "MOSTRAR" : "OCULTAR"}</Text>
          </Pressable>
        )}
      </View>
      {error && <Text className="text-label-sm text-error">{error}</Text>}
    </View>
  );
}