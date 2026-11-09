// Create the two demo users. User 1 is not onboarded, user 2 is.
// Returns their user ids.
import { supabaseAdmin } from "../../../lib/supabaseAdmin.ts";
import type { SeedConfig } from "../setup/config.ts";
import { DAY, fail, ok } from "../setup/helpers.ts";

async function createUser(
  email: string,
  password: string,
  name: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // No confirmation mail needed
    user_metadata: { name }, // Read by handle_new_user() -> profiles.name
    app_metadata: { demo_seed: true }, // Only users with this mark are ever deleted by this script
  });
  if (error) fail(`Failed to create ${email}:`, error);
  return data.user.id;
}

export async function createUsers(
  config: SeedConfig,
  now: number,
): Promise<{ user1: string; user2: string }> {
  const user1 = await createUser(
    config.user1.email,
    config.user1.password,
    "Alex",
  );
  const user2 = await createUser(
    config.user2.email,
    config.user2.password,
    "Robin",
  );

  // No notification mails for demo users. User 1 goes through onboarding in the app, user 2 is already done
  ok(
    await supabaseAdmin
      .from("profiles")
      .update({ notification_frequency: "none" })
      .eq("id", user1),
    "update user 1's profile",
  );
  ok(
    await supabaseAdmin
      .from("profiles")
      .update({
        notification_frequency: "none",
        onboarding_completed_at: new Date(now - 3 * DAY).toISOString(),
      })
      .eq("id", user2),
    "update user 2's profile",
  );

  console.log(
    `Created user 1 ${config.user1.email} (not onboarded) and user 2 ${config.user2.email}`,
  );

  return { user1, user2 };
}
