import { Text, StyleSheet, type TextStyle } from "react-native";

function familyForWeight(style: unknown): string {
  const flat = StyleSheet.flatten(style as TextStyle) as TextStyle | undefined;
  switch (String(flat?.fontWeight ?? "400")) {
    case "100":
    case "200":
    case "300":
      return "Poppins_300Light";
    case "500":
    case "600":
      return "Poppins_600SemiBold";
    case "700":
      return "Poppins_700Bold";
    case "800":
    case "900":
      return "Poppins_800ExtraBold";
    default:
      return "Poppins_400Regular";
  }
}

let installed = false;

export function installPoppins() {
  if (installed) return;
  installed = true;
  const AnyText = Text as unknown as {
    render: (props: any, ref: any) => unknown;
  };
  const previous = AnyText.render;
  AnyText.render = function render(props: any, ref: any) {
    const fontFamily = familyForWeight(props?.style);
    return previous.call(
      this,
      { ...props, style: [{ fontFamily }, props?.style] },
      ref,
    );
  };
}
