import { useRef, useState } from "react";
import { View, TextInput, Pressable, Text } from "react-native";

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

const CELLS = 6;

export function OTPInput({ value, onChange, error }: OTPInputProps) {
  const inputRef = useRef<TextInput>(null);

  const cells = Array.from({ length: CELLS }, (_, i) => value[i] ?? "");

  return (
    <Pressable onPress={() => inputRef.current?.focus()} className="flex-row gap-2 justify-center">
      {/* Hidden real input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, "").slice(0, CELLS))}
        keyboardType="number-pad"
        maxLength={CELLS}
        className="absolute opacity-0 w-full h-full"
        autoFocus
      />
      {cells.map((char, i) => {
        const isFocused = value.length === i;
        const borderColor = error
          ? "border-error"
          : isFocused
          ? "border-primary"
          : char
          ? "border-outline"
          : "border-outline-variant";

        return (
          <View
            key={i}
            className={`
              w-12 h-14 rounded items-center justify-center
              bg-surface-lowest border ${borderColor}
            `}
          >
            <Text className="text-headline-mobile text-on-surface font-bold">
              {char || ""}
            </Text>
          </View>
        );
      })}
    </Pressable>
  );
}
