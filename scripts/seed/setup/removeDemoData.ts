// Remove the previous demo data (demo users and seed listings).
import { supabaseAdmin } from "../../lib/supabaseAdmin.ts";
import { AGENCY, check, fail } from "./helpers.ts";
import type { AuthUser } from "./safetyCheck.ts";

export async function removeDemoData(demoUsers: AuthUser[]): Promise<void> {
  // Deleting the auth user cascades to profiles, search_params, user_listings, tags, invites and personal showings.
  // handle_deleted_profile() dissolves the demo group (and its showings) once nobody is left in it.
  for (const u of demoUsers) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
    if (error) fail(`Failed to delete demo user ${u.email}:`, error);
  }

  // Cascades to user_listings, listing_tags and showings on these listings, also those of other users
  const removedListings = check(
    await supabaseAdmin
      .from("listings")
      .delete()
      .eq("agency", AGENCY)
      .select("id"),
    "delete seed listings",
  );

  console.log(
    `Removed ${demoUsers.length} demo user(s) and ${removedListings.length} seed listing(s)`,
  );
}
