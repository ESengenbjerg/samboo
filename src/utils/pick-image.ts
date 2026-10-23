import * as ImagePicker from "expo-image-picker";

export async function pickImage(setProfileImage: (uri: string) => void) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    setProfileImage(result.assets[0].uri);
  }
}
