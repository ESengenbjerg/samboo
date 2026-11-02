import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

// Width of the saved profile image. The bucket allows max 2 MB
const AVATAR_SIZE = 512;

// Lets the user pick an image and returns the uri of a resized JPEG, or null if cancelled.
// Always JPEG: also converts HEIC, which the bucket does not allow
export async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;

  // Only width: height follows the aspect ratio. Do not pass height: null,
  // the web version then resizes to height 0 and throws
  const image = await ImageManipulator.manipulate(result.assets[0].uri)
    .resize({ width: AVATAR_SIZE })
    .renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
  });

  return saved.uri;
}
