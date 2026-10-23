import { supabase } from "@/lib/supabase";

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
