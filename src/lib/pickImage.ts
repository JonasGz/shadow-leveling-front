import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

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

  const size =
    asset.width >= asset.height ? { width: maxSize } : { height: maxSize };
  const image = await ImageManipulator.manipulate(asset.uri)
    .resize(size)
    .renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.7,
  });
  return saved.uri;
}
