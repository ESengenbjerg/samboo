import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useOnboardingStore } from "@/stores/onboarding";
import { pickImage } from "@/utils/pick-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import ProfileImage from "../profile-image";

export default function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const setProfile = useOnboardingStore((s) => s.setProfile);

  async function selectImage() {
    setIsLoading(true);
    try {
      const asset = await pickImage();
      if (asset) setProfileImage(asset);
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit() {
    setError(null);

    if (!profileName && !profileImage) {
      setError("Lägg till visningsnamn och profilbild.");
      return;
    }
    if (!profileName) {
      setError("Lägg till ett visningsnamn.");
      return;
    }
    if (!profileImage) {
      setError("Lägg till en profilbild.");
      return;
    }

    setProfile(profileName, profileImage.uri);
    router.push({ pathname: "/create-filter" });

    console.log("Image: " + profileImage.uri);
  }

  return (
    <View className="flex-1 justify-center w-full px-8 gap-6">
      <Text variant="h1">Din profil</Text>
      <View className="gap-1.5">
        <Label htmlFor="profile-name">Visningsnamn</Label>
        <Input
          id="profile-name"
          placeholder="Namn"
          returnKeyType="next"
          submitBehavior="submit"
          maxLength={100}
          value={profileName}
          onChangeText={setProfileName}
          editable={!isLoading}
          textContentType="name"
        />
      </View>
      <View className="gap-1.5">
        <Label htmlFor="profile-image">Profilbild</Label>

        <Button variant="outline" onPress={selectImage} disabled={isLoading}>
          <Text>{profileImage ? "Byt bild" : "Välj bild"}</Text>
        </Button>
      </View>

      <View className="self-center">
        {profileImage && profileName ? (
          <View className="items-center gap-2">
            <ProfileImage uri={profileImage.uri}></ProfileImage>
            <Text variant="bold">{profileName}</Text>
          </View>
        ) : null}

        {profileImage && !profileName ? (
          <ProfileImage uri={profileImage.uri}></ProfileImage>
        ) : null}
      </View>

      {error && <FormError>{error}</FormError>}

      <Button variant="secondary" onPress={onSubmit} disabled={isLoading}>
        <Text>{!isLoading ? "Spara" : "Sparar..."}</Text>
      </Button>
    </View>
  );
}
