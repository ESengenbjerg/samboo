import { supabase } from "@/lib/supabase";
import { InformationInterval } from "@/stores/onboarding";
import { StorageApiError } from "@supabase/supabase-js";

const AVATAR_BUCKET = "avatars";

export function getAvatarUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function getProfile(userId: string) {
  return supabase
    .from("profiles")
    .select("name, avatar_path, notification_frequency")
    .eq("id", userId)
    .single();
}

export function updateProfileName(userId: string, name: string) {
  return supabase.from("profiles").update({ name }).eq("id", userId);
}

export function updateNotificationFrequency(
  userId: string,
  frequency: InformationInterval,
) {
  return supabase
    .from("profiles")
    .update({ notification_frequency: frequency })
    .eq("id", userId);
}

export function getOnboardingStatus(userId: string) {
  return supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .single();
}

// Save name and update onboarding_completed_at with correct date
export function completeProfile(
  userId: string,
  name: string,
  frequency: InformationInterval,
) {
  return supabase
    .from("profiles")
    .update({
      name,
      onboarding_completed_at: new Date().toISOString(),
      notification_frequency: frequency,
    })
    .eq("id", userId)
    .select("id, name, onboarding_completed_at")
    .single();
}

// Uploads a resized JPEG from pickImage() into the user's own folder.
// Returns the path to save in profiles.avatar_path
export async function uploadAvatar(userId: string, uri: string) {
  const response = await fetch(uri);
  // ArrayBuffer, not Blob: a Blob from fetch() often uploads as an empty file in React Native
  const body = await response.arrayBuffer();
  if (body.byteLength === 0) {
    throw new Error("Kunde inte läsa den valda bilden.");
  }

  // A new random name every upload, the bucket does not allow overwrite
  const fileName = `avatar-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.jpg`;
  const path = `${userId}/${fileName}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, body, { contentType: "image/jpeg", upsert: false });

  if (error) throw error;
  return path;
}

export function updateProfileAvatarPath(
  userId: string,
  avatarPath: string | null,
) {
  return supabase
    .from("profiles")
    .update({ avatar_path: avatarPath })
    .eq("id", userId)
    .select("id, avatar_path")
    .single();
}

export function deleteAvatar(avatarPath: string) {
  return supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);
}

// Swedish message for errors from uploading a profile image
export function avatarErrorMessage(error: unknown) {
  if (error instanceof StorageApiError) {
    if (error.statusCode === "413" || error.status === 413) {
      return "Bilden är för stor. Välj en annan bild.";
    }
    // Account not active, or the folder already has 5 files
    if (
      error.statusCode === "403" ||
      error.message.includes("row-level security")
    ) {
      return "Du kan inte ladda upp fler bilder just nu. Försök igen senare.";
    }
  }
  return "Kunde inte spara profilbilden. Försök igen.";
}
