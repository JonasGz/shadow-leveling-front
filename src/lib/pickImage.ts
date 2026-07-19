import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// pickImage opens the library and returns the chosen image URI, or null if the
// user cancelled or denied permission.
//
// maxSize é o lado mais longo em pixels, e é obrigatório porque não existe um
// bom default: avatar e foto de sessão renderizam em escalas 10x diferentes.
// O picker devolve a foto na resolução original (3000x4000, ~2MB mesmo com
// quality 0.7) e o backend faz upload direto, sem processar — sem esse resize
// um avatar de 40pt baixa 2MB.
export async function pickImage(maxSize: number): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.7,
  });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  if (Math.max(asset.width, asset.height) <= maxSize) return asset.uri;

  // Limita o lado mais longo; o outro o manipulator calcula pela proporção.
  const size =
    asset.width >= asset.height ? { width: maxSize } : { height: maxSize };
  const image = await ImageManipulator.manipulate(asset.uri)
    .resize(size)
    .renderAsync();
  // compress é obrigatório: o default do saveAsync é 1 (sem compressão), que
  // re-encoda a imagem e desfaz o quality: 0.7 do picker. 0.7 aqui bate com o
  // do picker e é o que separa um avatar de 512px de ~400KB de um de ~40KB.
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.7,
  });
  return saved.uri;
}
