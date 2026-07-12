import { Text, StyleSheet, type TextStyle } from "react-native";

// Map a resolved fontWeight to the matching Open Sans family. Using one family
// per weight makes bold render correctly on Android too (Android ignores
// fontWeight for custom fonts, so a single family would lose all weights).
function familyForWeight(style: unknown): string {
  const flat = StyleSheet.flatten(style as TextStyle) as TextStyle | undefined;
  switch (String(flat?.fontWeight ?? "400")) {
    case "100":
    case "200":
    case "300":
      return "OpenSans_300Light";
    case "500":
    case "600":
      return "OpenSans_600SemiBold";
    case "700":
      return "OpenSans_700Bold";
    case "800":
    case "900":
      return "OpenSans_800ExtraBold";
    default:
      return "OpenSans_400Regular";
  }
}

let installed = false;

// Makes every <Text> use Open Sans by default, picking the weight-matched family
// from the element's own fontWeight. Call once, before anything renders. The
// element's explicit style still wins (it's applied after), so a component can
// override the family if it ever needs to.
export function installOpenSans() {
  if (installed) return;
  installed = true;
  const AnyText = Text as unknown as { render: (props: any, ref: any) => unknown };
  const previous = AnyText.render;
  AnyText.render = function render(props: any, ref: any) {
    const fontFamily = familyForWeight(props?.style);
    return previous.call(this, { ...props, style: [{ fontFamily }, props?.style] }, ref);
  };
}
