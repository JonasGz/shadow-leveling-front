import { Image } from "expo-image";
import { cssInterop } from "nativewind";

// O expo-image não vem com cssInterop registrado, então className é ignorado e
// as imagens renderizam com tamanho zero (o mesmo motivo do comentário sobre
// LinearGradient em app/(auth)/welcome.tsx). Registrar aqui, uma vez, mantém
// className funcionando nas telas — a alternativa seria style={{}} em cada uma.
//
// Importe Image DESTE módulo, não de "expo-image": é o import que garante que
// o registro rodou antes do primeiro render.
cssInterop(Image, { className: "style" });

export { Image };
