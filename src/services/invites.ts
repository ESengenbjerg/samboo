import { supabase } from "@/utils/supabase";

export async function sendInvite(toEmail: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");

  const { error } = await supabase
    .from("invites")
    .insert({ from_user_id: session.user.id, to_email: toEmail });
  if (error) throw error;
}
