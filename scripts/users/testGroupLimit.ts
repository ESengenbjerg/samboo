// This file aims to test the group size limit (accept_invite(), see supabase/schema.sql)

// Creates 11 temporary users through the Auth Admin API (no e-mail is sent), signs in as each one with the PUBLISHABLE key
// like the app does, lets user 1 invite the other 10 and lets each of them accept.
// Expected: users 2-10 join (group of 10), user 11 is rejected with "Gruppen är full (max 10 medlemmar)".
// The test users are deleted at the end, also if the test fails halfway.

import { createClient } from "@supabase/supabase-js";

// Fetch credentials in dotenv
process.loadEnvFile(".env");

// Fetch DB connection
const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or a publishable key in dotenv");
}

const TOTAL = 11;
const MAX = 10;
const password = `Test-${crypto.randomUUID()}`;
const runId = Date.now();

const users = Array.from({ length: TOTAL }, (_, i) => ({
  n: i + 1,
  email: `group-limit-test-${runId}-${i + 1}@example.com`,
  id: "",
}));

const createdIds: string[] = [];
let pass = false;

try {
  // Create the users. The on_auth_user_created trigger creates the profiles
  for (const u of users) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password,
      email_confirm: true,
      user_metadata: { name: `GroupTest${u.n}` },
    });
    if (error || !data.user) {
      throw new Error(`Could not create user ${u.n}: ${error?.message}`);
    }
    u.id = data.user.id;
    createdIds.push(u.id);
  }
  console.log(`Created ${TOTAL} test users`);

  // One normal client per user, as the app would use it
  const clients = [];
  for (const u of users) {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.auth.signInWithPassword({
      email: u.email,
      password,
    });
    if (error) throw new Error(`Sign in failed for user ${u.n}: ${error.message}`);
    clients.push(client);
  }

  // User 1 invites everyone else
  for (const u of users.slice(1)) {
    const { error } = await clients[0]
      .from("invites")
      .insert({ from_user_id: users[0].id, to_email: u.email });
    if (error) throw new Error(`Invite to user ${u.n} failed: ${error.message}`);
  }
  console.log(`User 1 sent ${TOTAL - 1} invites\n`);

  // Everyone accepts in order
  const results: { n: number; ok: boolean; message: string }[] = [];
  for (let i = 1; i < TOTAL; i++) {
    const { data: invite, error: readError } = await clients[i]
      .from("invites")
      .select("id")
      .eq("status", "pending")
      .single();
    if (readError || !invite) {
      throw new Error(`User ${i + 1} cannot see the invite: ${readError?.message}`);
    }

    const { error } = await clients[i].rpc("accept_invite", {
      invite_id: invite.id,
    });
    results.push({ n: i + 1, ok: !error, message: error?.message ?? "joined" });
    console.log(`User ${i + 1}: ${error ? `REJECTED (${error.message})` : "joined"}`);
  }

  // Count the members straight from the DB
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("group_id")
    .eq("id", users[0].id)
    .single();
  const { count } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("group_id", profile?.group_id ?? -1);

  const joined = results.filter((r) => r.ok).length;
  const last = results[results.length - 1];
  console.log(`\nMembers in the group: ${count} (limit ${MAX})`);

  pass =
    count === MAX &&
    joined === MAX - 1 &&
    !last.ok &&
    last.message.includes("full");
} catch (err) {
  console.error(err);
} finally {
  // Deleting the users also removes profiles, invites and the group (dissolved by the delete trigger)
  for (const id of createdIds) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) console.error(`Could not delete test user ${id}:`, error.message);
  }
  console.log(`Deleted ${createdIds.length} test users`);
}

console.log(pass ? "\nRESULT: as expected" : "\nRESULT: NOT as expected");
process.exitCode = pass ? 0 : 1;

// Run in Terminal:
// node scripts/users/testGroupLimit.ts
