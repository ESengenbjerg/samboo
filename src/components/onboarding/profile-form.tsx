import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useOnboardingStore } from "@/stores/onboarding";
import { pickImage } from "@/utils/pick-image";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function ProfileForm() {
  // TODO: setIsLoading will be used once Supabase implementation is complete
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const setProfile = useOnboardingStore((s) => s.setProfile);

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

    setProfile(profileName, profileImage);
    router.push({ pathname: "/create-filter" });
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

        <Button
          variant="outline"
          onPress={() => pickImage(setProfileImage)}
          disabled={isLoading}
        >
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
  );
}
