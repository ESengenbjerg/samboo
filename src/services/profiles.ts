import { supabase } from "@/lib/supabase";

export type ProfileRow = {
  name: string | null;
  avatar_path: string | null;
};

const AVATAR_BUCKET = "avatars";
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function getAvatarUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

export function getProfile(userId: string) {
  return supabase
    .from("profiles")
    .select("name, avatar_path")
    .eq("id", userId)
    .single()
    .overrideTypes<ProfileRow>();
}

export function updateProfileName(userId: string, name: string) {
  return supabase.from("profiles").update({ name }).eq("id", userId);
}

export function getOnboardingStatus(userId: string) {
  return supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .single();
}

// Save name and update onboarding_completed_at with correct date
export function completeProfile(userId: string, name: string) {
  return supabase
    .from("profiles")
    .update({
      name,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function uploadAvatar(userId: string, uri: string) {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error("Kunde inte läsa den valda bilden.");
  }

  const blob = await response.blob();
  if (!ALLOWED_AVATAR_TYPES.has(blob.type)) {
    throw new Error("Profilbilden måste vara JPG, PNG eller WebP.");
  }

  const extension = blob.type.split("/")[1].replace("jpeg", "jpg");
  const fileName = `avatar-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${extension}`;
  const path = `${userId}/${fileName}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false });

  if (error) throw error;
  return path;
}

export function updateProfileAvatarPath(userId: string, avatarPath: string | null) {
  return supabase
    .from("profiles")
    .update({ avatar_path: avatarPath })
    .eq("id", userId);
}

export function deleteAvatar(avatarPath: string) {
  return supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);
}
