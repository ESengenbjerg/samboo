import { supabase } from "@/lib/supabase";

export function createInvite(fromUserId: string, toEmail: string) {
  return supabase
    .from("invites")
    .insert({ from_user_id: fromUserId, to_email: toEmail });
}
