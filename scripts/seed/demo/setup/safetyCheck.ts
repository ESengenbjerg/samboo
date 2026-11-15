// Find the existing users and check that it is safe to run.
// Stops the script if a demo e-mail belongs to a real user, or if the database has real users (unless --allow-existing-users). Returns the demo users from the previous run.
import { supabaseAdmin } from "../../../lib/supabaseAdmin.ts";
import type { SeedConfig } from "./config.ts";
import { fail } from "./helpers.ts";

export type AuthUser = {
  id: string;
  email?: string;
  app_metadata: Record<string, unknown>;
};

async function listAllUsers(): Promise<AuthUser[]> {
  const all: AuthUser[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) fail("Failed to list users:", error);
    all.push(...data.users);
    if (data.users.length < 1000) return all;
  }
}

const isDemo = (u: AuthUser) => u.app_metadata?.demo_seed === true;

export async function findDemoUsersSafely(
  config: SeedConfig,
): Promise<AuthUser[]> {
  const users = await listAllUsers();
  const demoUsers = users.filter(isDemo);
  const otherUsers = users.filter((u) => !isDemo(u));

  const takenEmail = otherUsers.find((u) => {
    const email = u.email?.toLowerCase();
    return email === config.user1.email || email === config.user2.email;
  });
  if (takenEmail) {
    fail(
      `${takenEmail.email} already belongs to a user that was not created by this script. ` +
        "Choose other SEED_USER/SEED_FRIEND addresses in .env. That user is left untouched.",
    );
  }

  if (otherUsers.length > 0 && !config.allowExistingUsers) {
    fail(
      `The database has ${otherUsers.length} user(s) that are not demo users. ` +
        "Demo data is meant for an empty, separate Supabase project: the seed listings would show up for real users. " +
        "Run with --allow-existing-users if you are sure.",
    );
  }

  return demoUsers;
}
