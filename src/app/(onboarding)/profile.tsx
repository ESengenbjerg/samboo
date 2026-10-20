import FormError from "@/components/form-error";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useOnboardingStore } from "@/stores/onboarding";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function OnboardingProfileScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: When persistens is added (see /stores/onboarding), states should start from saved values
  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const setProfile = useOnboardingStore((s) => s.setProfile);

  async function pickImage() {
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

  function onSubmit() {
    setError(null);

    if (!profileName && !profileImage) {
      setError("Lägg till visningsnamn och visningsbild");
      return;
    }
    if (!profileName) {
      setError("Lägg till ett visningsnamn");
      return;
    }
    if (!profileImage) {
      setError("Lägg till en visningsbild");
      return;
    }

    setProfile(profileName, profileImage);
    router.push({ pathname: "/create-filter" });
  }

  return (
    <OnboardingScreen>
      <View className="flex-1 justify-center w-full px-12 gap-6">
        <Text variant="h1">Din profil</Text>
        <View className="gap-1.5">
          <Label htmlFor="profile-name">Visningsnamn</Label>
          <Input
            id="profile-name"
            placeholder="Namn"
            returnKeyType="next"
            submitBehavior="submit"
            value={profileName}
            onChangeText={setProfileName}
            editable={!isLoading}
            textContentType="name"
          />
        </View>
        <View className="gap-1.5">
          <Label htmlFor="profile-image">Visningsbild</Label>

          <Button variant="outline" onPress={pickImage} disabled={isLoading}>
            <Text>{profileImage ? "Byt bild" : "Välj bild"}</Text>
          </Button>
        </View>

        {profileImage && profileName ? (
          <View className="items-center gap-2">
            <Image
              source={{ uri: profileImage }}
              className="w-24 h-24 rounded-full self-center"
            />
            <Text variant="bold">{profileName}</Text>
          </View>
        ) : null}

        {profileImage && !profileName ? (
          <Image
            source={{ uri: profileImage }}
            className="w-24 h-24 rounded-full self-center"
          />
        ) : null}

        {error && <FormError>{error}</FormError>}

        <Button variant="secondary" onPress={onSubmit} disabled={isLoading}>
          <Text>{!isLoading ? "Spara" : "Sparar..."}</Text>
        </Button>
      </View>
    </OnboardingScreen>
  );
}
