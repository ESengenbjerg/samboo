import { useProfile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
import { updateProfileName } from "@/services/profiles";
import { useEffect, useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import FormMessage from "../form-message";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Text } from "../ui/text";

export default function ProfileSettingsForm() {
  const { session } = useSession();
  const userId = session?.user.id;
  const {
    profile,
    isLoading: isLoadingProfile,
    error: loadError,
  } = useProfile(userId);

  // Name currently saved in Supabase
  const [savedName, setSavedName] = useState("");
  // Name user has typed
  const [newName, setNewName] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Returns true if new name is typed in input
  const nameIsChanged: boolean = newName.trim() !== savedName;
  const errorMessage = saveError ?? loadError;
  const isLoading = isLoadingProfile || isSaving;

  // TODO: Add support for update image

  useEffect(() => {
    if (profile?.name) {
      setSavedName(profile.name);
      setNewName(profile.name);
    }
  }, [profile]);

  async function onSubmit() {
    if (!userId || !nameIsChanged) return;

    setSaveError(null);
    setSuccessMessage(null);

    if (!newName.trim()) {
      setSaveError("Du måste skriva in ett nytt namn för att spara.");
      return;
    }

    setIsSaving(true);
    const { error } = await updateProfileName(userId, newName.trim());
    setIsSaving(false);

    if (error) {
      console.log("Update profile error:", error);
      setSaveError("Kunde inte uppdatera namn. Försök igen.");
      return;
    }

    setSavedName(newName.trim());
    setSuccessMessage("Ditt visningsnamn har uppdaterats!");
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
            maxLength={100}
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={onSubmit}
            editable={!isLoading}
            textContentType="name"
            className="bg-white border-accent shadow-none"
          />
        </View>
        <View className="gap-1.5">
          <Label htmlFor="profile-image">Profilbild</Label>

          {/* TODO: Put back after added support for image */}
          {/* <Button
            variant="outline"
            onPress={() => pickImage(setProfileImage)}
            disabled={isProfileLoading}
            className="bg-white border-accent shadow-none"
          >
            <Text>{profileImage ? "Byt bild" : "Välj bild"}</Text>
          </Button> */}
        </View>

        {!!errorMessage && <FormError>{errorMessage}</FormError>}
        {!!successMessage && <FormMessage>{successMessage}</FormMessage>}

        <Button
          onPress={onSubmit}
          disabled={isLoading || !nameIsChanged}
          className="max-w-36"
        >
          <Text>{!isSaving ? "Uppdatera" : "Uppdaterar..."}</Text>
        </Button>
      </View>
    </View>
  );
}
