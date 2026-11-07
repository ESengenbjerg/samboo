import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useSession } from "@/hooks/useSession";
import { useUpdateProfileAvatar } from "@/hooks/useUpdateProfileAvatar";
import { getAvatarUrl } from "@/services/profiles";
import { useOnboardingStore } from "@/stores/onboarding";
import { pickImage } from "@/utils/pick-image";
import { router } from "expo-router";
import { Trash } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import AvatarPublicInfo from "../avatar-public-info";
import ProfileImage from "../profile-image";
import { Icon } from "../ui/icon";

export default function ProfileForm() {
  const { session } = useSession();
  const userId = session?.user.id;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileName, setProfileName] = useState("");
  // Resized JPEG picked on this visit. Uploaded when the user presses Spara
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // True when the user removed the image that was uploaded on an earlier visit
  const [removeSaved, setRemoveSaved] = useState(false);

  // Image uploaded on an earlier visit to this step (user went back)
  const savedAvatarPath = useOnboardingStore((s) => s.avatarPath);
  const setProfile = useOnboardingStore((s) => s.setProfile);

  const {
    updateAvatar,
    removeAvatar,
    isUpdating,
    error: avatarError,
    clearError: clearAvatarError,
  } = useUpdateProfileAvatar();

  const isBusy = isLoading || isUpdating;
  const displayError = error ?? avatarError;
  // Show the newly picked image, otherwise the one already uploaded
  const previewUri =
    profileImage ?? (removeSaved ? null : getAvatarUrl(savedAvatarPath));

  async function selectImage() {
    setError(null);
    setIsLoading(true);

    try {
      const uri = await pickImage();
      if (uri) {
        setProfileImage(uri);
        setRemoveSaved(false);
      }
    } catch (e) {
      console.log("Pick image error:", e);
      setError("Kunde inte läsa bilden. Välj en annan bild.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit() {
    setError(null);

    const trimmedName = profileName.trim();

    if (!trimmedName) {
      setError("Lägg till ett visningsnamn.");
      return;
    }

    if (!userId) {
      setError("Något gick fel, försök igen.");
      return;
    }

    let avatarPath = savedAvatarPath;

    // Upload before onboarding is completed, so no one is "done" without an image.
    // Passing the earlier path removes that file, so the folder does not fill up.
    if (profileImage) {
      avatarPath = await updateAvatar(userId, profileImage, savedAvatarPath);
      // useUpdateProfileAvatar sets the error message
      if (!avatarPath) return;
      setProfileImage(null);
    } else if (removeSaved && savedAvatarPath) {
      const removed = await removeAvatar(userId, savedAvatarPath);
      // useUpdateProfileAvatar sets the error message
      if (!removed) return;
      avatarPath = null;
    }

    setRemoveSaved(false);
    setProfile(trimmedName, avatarPath);
    router.push({ pathname: "/create-filter" });
  }

  function onRemove() {
    setProfileImage(null);
    if (savedAvatarPath) setRemoveSaved(true);
    clearAvatarError();
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
          editable={!isBusy}
          textContentType="name"
        />
      </View>
      <View className="gap-1.5">
        <Label htmlFor="profile-image">Profilbild (valfritt)</Label>

        <Button
          id="profile-image"
          variant="outline"
          onPress={selectImage}
          disabled={isBusy}
        >
          <Text>{previewUri ? "Byt bild" : "Välj bild"}</Text>
        </Button>

        {previewUri && (
          <Button variant="destructive" onPress={onRemove} disabled={isBusy}>
            <Text>{"Ta bort bild"}</Text>
            <Icon as={Trash} />
          </Button>
        )}
      </View>

      <AvatarPublicInfo location="Inställningar" />

      <View className="self-center">
        {previewUri ? (
          <View className="items-center gap-2">
            <ProfileImage uri={previewUri}></ProfileImage>
            {profileName ? <Text variant="bold">{profileName}</Text> : null}
          </View>
        ) : null}
      </View>

      {displayError && <FormError>{displayError}</FormError>}

      <Button variant="secondary" onPress={onSubmit} disabled={isBusy}>
        <Text>{!isBusy ? "Spara" : "Sparar..."}</Text>
      </Button>
    </View>
  );
}
