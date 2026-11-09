// User 2 invites user 1 to a group.
import { supabaseAdmin } from "../../../lib/supabaseAdmin.ts";
import { ok } from "../setup/helpers.ts";

export async function createFriendInvite(
  user2: string,
  user1Email: string,
): Promise<void> {
  // Shows up for user 1 under notifications (my_pending_invites() matches on the signed-in user's e-mail)
  ok(
    await supabaseAdmin
      .from("invites")
      .insert({ from_user_id: user2, to_email: user1Email }),
    "insert the invite to user 1",
  );
}
