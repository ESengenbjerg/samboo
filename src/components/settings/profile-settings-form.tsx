import { useProfile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
import { useUpdateProfileAvatar } from "@/hooks/useUpdateProfileAvatar";
import { getAvatarUrl, updateProfileName } from "@/services/profiles";
import { pickImage } from "@/utils/pick-image";
import { Trash } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import FormMessage from "../form-message";
import ProfileImage from "../profile-image";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
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
  const {
    updateAvatar,
    removeAvatar,
    isUpdating: isUpdatingAvatar,
    error: avatarError,
    clearError: clearAvatarError,
  } = useUpdateProfileAvatar();

  // Name saved on this visit. Until then, the one from Supabase is used
  const [updatedName, setUpdatedName] = useState<string | null>(null);
  const savedName = updatedName ?? profile?.name ?? "";
  // Name user has typed. Until then, the input shows the saved name
  const [typedName, setTypedName] = useState<string | null>(null);
  const newName = typedName ?? savedName;

  // Image uploaded on this visit. Until then, the one from Supabase is used
  const [newAvatarPath, setNewAvatarPath] = useState<string | null>(null);
  // True after the user removed their image on this visit
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const currentAvatarPath = avatarRemoved
    ? null
    : (newAvatarPath ?? profile?.avatarPath ?? null);
  const avatarUrl = getAvatarUrl(currentAvatarPath);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Returns true if new name is typed in input
  const nameIsChanged: boolean = newName.trim() !== savedName;
  const errorMessage = saveError ?? avatarError ?? loadError;
  const isLoading = isLoadingProfile || isSaving || isUpdatingAvatar;

  async function onSubmit() {
    if (!userId || !nameIsChanged) return;

    setSaveError(null);
    clearAvatarError();
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

    setUpdatedName(newName.trim());
    setTypedName(null);
    setSuccessMessage("Ditt visningsnamn har uppdaterats!");
  }

  async function onChangeImage() {
    if (!userId) return;

    setSaveError(null);
    setSuccessMessage(null);

    let uri: string | null;
    try {
      uri = await pickImage();
    } catch (e) {
      console.log("Pick image error:", e);
      setSaveError("Kunde inte läsa bilden. Välj en annan bild.");
      return;
    }

    if (!uri) return;

    const path = await updateAvatar(userId, uri, currentAvatarPath);
    if (!path) return;

    setAvatarRemoved(false);
    setNewAvatarPath(path);
    setSuccessMessage("Din profilbild har uppdaterats!");
  }

  async function onRemove() {
    if (!userId || !currentAvatarPath) return;

    setSaveError(null);
    clearAvatarError();
    setSuccessMessage(null);

    const removed = await removeAvatar(userId, currentAvatarPath);
    if (!removed) return;

    setNewAvatarPath(null);
    setAvatarRemoved(true);
    setSuccessMessage("Din profilbild har tagits bort.");
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
            onChangeText={setTypedName}
            onSubmitEditing={onSubmit}
            editable={!isLoading}
            textContentType="name"
            className="bg-white border-accent shadow-none"
          />
        </View>
        <View className="gap-1.5">
          <Label htmlFor="profile-image">Profilbild</Label>

          <View className="flex-row gap-2 justify-between">
            <View className="gap-1.5">
              <Button
                variant="outline"
                onPress={onChangeImage}
                disabled={isLoading}
                className="bg-white border-accent shadow-none w-44"
              >
                <Text>
                  {isUpdatingAvatar
                    ? "Laddar upp..."
                    : currentAvatarPath
                      ? "Byt bild"
                      : "Välj bild"}
                </Text>
              </Button>
              {currentAvatarPath && (
                <Button
                  variant="destructive"
                  onPress={onRemove}
                  disabled={isLoading}
                  className="w-44"
                >
                  <Text>Ta bort bild</Text>
                  <Icon as={Trash} />
                </Button>
              )}
            </View>
            {avatarUrl && <ProfileImage uri={avatarUrl} />}
          </View>
        </View>

        {!!errorMessage && <FormError>{errorMessage}</FormError>}
        {!!successMessage && <FormMessage>{successMessage}</FormMessage>}

        <Button
          onPress={onSubmit}
          disabled={isLoading || !nameIsChanged}
          className="max-w-44"
        >
          <Text>{!isSaving ? "Uppdatera" : "Uppdaterar..."}</Text>
        </Button>
      </View>
    </View>
  );
}
