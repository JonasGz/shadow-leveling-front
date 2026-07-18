import { memo } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import Check from "lucide-react-native/icons/check";

/** Uma linha de série em edição. `remoteId` só existe após gravar na API. */
export interface LocalSet {
  weight: string;
  reps: string;
  duration: string;
  done: boolean;
  remoteId?: string;
}

export type SetField = "weight" | "reps" | "duration";

// Mesma correção de métrica usada em Input/SearchInput: sem isso o número
// fica caído dentro da caixa no Android.
const SET_FIELD_TEXT = {
  fontSize: 14,
  lineHeight: 16,
  includeFontPadding: false,
  fontWeight: "600" as const,
};

interface SetRowProps {
  index: number;
  set: LocalSet;
  timed: boolean;
  /** Primeira série ainda não concluída — recebe o destaque de "faça agora". */
  isActiveRow: boolean;
  onChangeField: (index: number, field: SetField, value: string) => void;
  onToggleDone: (index: number) => void;
}

export const SetRow = memo(function SetRow({
  index,
  set,
  timed,
  isActiveRow,
  onChangeField,
  onToggleDone,
}: SetRowProps) {
  // altura vem do padding: h-[..] + py-* juntos zeram a área do texto
  const fieldClass = `py-3 rounded-lg border text-center ${
    isActiveRow && !set.done
      ? "bg-background border-primary/60 text-[#fff]"
      : "bg-[#151417] border-[#FFFFFF14] text-on-surface-variant"
  } ${set.done ? "opacity-50" : ""}`;

  return (
    <View
      className={`mt-1 flex-row items-center gap-2 rounded-xl border px-2 py-4 ${
        isActiveRow ? "border-primary/50 bg-primary/10" : "border-transparent"
      }`}
    >
      <Text
        className={`w-8 text-center text-body-md font-bold ${
          isActiveRow ? "text-secondary" : "text-outline"
        }`}
      >
        {index + 1}
      </Text>

      <TextInput
        value={timed ? set.duration : set.weight}
        onChangeText={(v) =>
          onChangeField(index, timed ? "duration" : "weight", v)
        }
        editable={!set.done}
        keyboardType="numeric"
        placeholder="– –"
        placeholderTextColor="#49474D"
        style={SET_FIELD_TEXT}
        className={`flex-1 ${fieldClass}`}
      />

      {!timed && (
        <TextInput
          value={set.reps}
          onChangeText={(v) => onChangeField(index, "reps", v)}
          editable={!set.done}
          keyboardType="numeric"
          placeholder="– –"
          placeholderTextColor="#49474D"
          style={SET_FIELD_TEXT}
          className={`flex-1 ${fieldClass}`}
        />
      )}

      <View className="w-9 items-center">
        <Pressable
          onPress={() => onToggleDone(index)}
          disabled={set.done}
          className={`h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
            set.done
              ? "border-secondary bg-secondary/20"
              : isActiveRow
                ? "border-outline active:border-primary"
                : "border-[#3A393E]"
          }`}
        >
          {set.done && <Check size={12} color="#B26CFF" />}
        </Pressable>
      </View>
    </View>
  );
});
