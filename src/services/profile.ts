import { supabase } from "@/utils/supabase";

// Reads the session from local storage (no network request)
async function getUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");
  return session.user.id;
}

export async function getProfile() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("name, onboarding_completed_at")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

// Saves name and marks onboarding as completed
export async function completeOnboardingProfile(name: string) {
  const userId = await getUserId();
  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}
