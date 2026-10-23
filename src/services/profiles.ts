import { supabase } from "@/lib/supabase";

// TODO: add "avatar_url" to select once the column and image upload exist
export function getProfile(userId: string) {
  return supabase.from("profiles").select("name").eq("id", userId).single();
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
