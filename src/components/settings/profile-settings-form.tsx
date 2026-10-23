import { useOnboardingStore } from "@/stores/onboarding";
import { pickImage } from "@/utils/pick-image";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import FormMessage from "../form-message";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Text } from "../ui/text";

export default function ProfileSettingsForm() {
  // TODO: setIsLoading will be used once Supabase implementation is complete
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [profileName, setProfileName] = useState("");
  const [updatedProfileName, setUpdatedProfileName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [updatedProfileImage, setUpdatedProfileImage] = useState("");
  const setProfile = useOnboardingStore((s) => s.setProfile);

  function onSubmit() {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (
      profileName !== updatedProfileName &&
      profileImage !== updatedProfileImage
    ) {
      setProfile(updatedProfileName, updatedProfileImage);
      setMessage("Ditt visningsnamn och profilbild har uppdaterats!");
      setIsLoading(false);
      return;
    }

    if (profileName !== updatedProfileName) {
      setProfile(updatedProfileName, profileImage);
      setMessage("Ditt visningsnamn har uppdaterats!");
      setIsLoading(false);
      return;
    }
    if (profileImage !== updatedProfileImage) {
      setProfile(profileName, updatedProfileImage);
      setMessage("Din profilbild har uppdaterats!");
      setIsLoading(false);
      return;
    }

    if (!updatedProfileName && !updatedProfileImage) {
      setError(
        "Skriv in önskat namn eller lägg till en bild för att uppdatera din profil.",
      );
      setIsLoading(false);
      return;
    }
  }

  return (
    <View className="gap-2">
      <Text variant="h2">Uppdatera profil</Text>
      <View className="gap-6">
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
            className="bg-white border-accent shadow-none"
          />
        </View>
        <View className="gap-1.5">
          <Label htmlFor="profile-image">Profilbild</Label>

          <Button
            variant="outline"
            onPress={() => pickImage(setProfileImage)}
            disabled={isLoading}
            className="bg-white border-accent shadow-none"
          >
            <Text>{profileImage ? "Byt bild" : "Välj bild"}</Text>
          </Button>
        </View>

        {error && <FormError>{error}</FormError>}
        {message && <FormMessage>{message}</FormMessage>}

        <Button onPress={onSubmit} disabled={isLoading} className="max-w-36">
          <Text>{!isLoading ? "Uppdatera" : "Uppdaterar..."}</Text>
        </Button>
      </View>
    </View>
  );
}
