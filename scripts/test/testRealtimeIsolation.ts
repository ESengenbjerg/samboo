// This file tests that Realtime only delivers changes the user may read (RLS), see docs/database-design.md#realtime
// USAGE: node scripts/test/testRealtimeIsolation.ts

// Signs in as the two test users with the PUBLISHABLE key, like the app does, and checks:
//   1. Both subscribe to showings, invites and profiles. User 1 also subscribes with a filter on user 2's id.
//   2. User 2 creates, changes and deletes a personal showing, sends and cancels an invite, and saves its own name.
//   3. User 2 receives its own events (control). User 1 receives no INSERT or UPDATE events.
//   DELETE events are only reported: Realtime cannot check RLS on a deleted row, so they may reach every subscriber, with only the primary key in the old record.

// If the two test users share a group, user 2 leaves it first. Nothing else about the users is changed.
// The user_listings row added for user 2, the showing and the invite are removed afterwards.

import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types.ts";

process.loadEnvFile(".env");

const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY;
const email1 = process.env.TEST_USER_EMAIL;
const password1 = process.env.TEST_USER_PASSWORD;
const email2 = process.env.TEST_USER2_EMAIL;
const password2 = process.env.TEST_USER2_PASSWORD;

if (!url || !key || !email1 || !password1 || !email2 || !password2) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL, a publishable key or the TEST_USER / TEST_USER2 credentials in dotenv",
  );
}

const TABLES = ["showings", "invites", "profiles"] as const;
const INVITE_TO = "realtime-test@example.com";
const WAIT_MS = 4000; // Time for the events to arrive after the last change

type User = { client: SupabaseClient<Database>; id: string; email: string };
type Received = {
  channel: string;
  table: string;
  event: string;
  oldKeys: string[];
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// A normal client as the app would use it, not the admin client
async function signIn(email: string, password: string): Promise<User> {
  const client = createClient<Database>(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user || !data.session) {
    console.error(`Sign in failed for ${email}:`, error);
    process.exit(1);
  }
  // Realtime checks RLS with the user's token
  client.realtime.setAuth(data.session.access_token);
  return { client, id: data.user.id, email };
}

// Subscribes to every change in the tables (or one filtered table) and resolves when the channel is ready
function subscribe(
  user: User,
  name: string,
  received: Received[],
  filtered?: { table: (typeof TABLES)[number]; filter: string },
): Promise<RealtimeChannel> {
  const channel = user.client.channel(name);
  const tables = filtered ? [filtered.table] : TABLES;
  for (const table of tables) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        ...(filtered ? { filter: filtered.filter } : {}),
      },
      (payload) => {
        received.push({
          channel: name,
          table,
          event: payload.eventType,
          oldKeys: Object.keys(payload.old ?? {}),
        });
      },
    );
  }
  return new Promise((resolve, reject) => {
    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") resolve(channel);
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        reject(err ?? new Error(`${name}: ${status}`));
      }
    });
  });
}

const user1 = await signIn(email1, password1);
const user2 = await signIn(email2, password2);
console.log(`Signed in as ${user1.email} and ${user2.email}`);

// The two must not share a group, or user 1 would be allowed to see user 2's rows
const { data: profiles } = await supabaseAdmin
  .from("profiles")
  .select("id, group_id")
  .in("id", [user1.id, user2.id]);
const group1 = profiles?.find((p) => p.id === user1.id)?.group_id ?? null;
const group2 = profiles?.find((p) => p.id === user2.id)?.group_id ?? null;
if (group1 !== null && group1 === group2) {
  console.log("The test users share a group: user 2 leaves it");
  const { error } = await user2.client.rpc("leave_group");
  if (error) {
    console.error("leave_group failed:", error);
    process.exit(1);
  }
}

// User 2 needs a listing it may see (can_see_listing() reads user_listings) and has no showing for
const { data: ownRows } = await supabaseAdmin
  .from("user_listings")
  .select("listing_id")
  .eq("user_id", user2.id);
const { data: ownShowings } = await supabaseAdmin
  .from("showings")
  .select("listing_id")
  .eq("user_id", user2.id);
const taken = new Set([
  ...(ownRows ?? []).map((r) => r.listing_id),
  ...(ownShowings ?? []).map((r) => r.listing_id),
]);
const { data: listings } = await supabaseAdmin
  .from("listings")
  .select("id")
  .is("removed_at", null)
  .order("id", { ascending: false })
  .limit(200);
const listingId = (listings ?? [])
  .map((l) => l.id)
  .find((id) => !taken.has(id));
if (listingId === undefined) {
  console.error("Found no listing to use");
  process.exit(1);
}

let addedUserListing = false;
let showingId: number | null = null;
let inviteId: number | null = null;

async function cleanup() {
  await user1.client.removeAllChannels();
  await user2.client.removeAllChannels();
  if (showingId !== null) {
    await supabaseAdmin.from("showings").delete().eq("id", showingId);
  }
  if (inviteId !== null) {
    await supabaseAdmin.from("invites").delete().eq("id", inviteId);
  }
  if (addedUserListing) {
    await supabaseAdmin
      .from("user_listings")
      .delete()
      .eq("user_id", user2.id)
      .eq("listing_id", listingId!);
  }
}

const received1: Received[] = [];
const received2: Received[] = [];

try {
  const { error: ulError } = await supabaseAdmin
    .from("user_listings")
    .insert({ user_id: user2.id, listing_id: listingId });
  if (ulError)
    throw new Error(`Could not add user_listings row: ${ulError.message}`);
  addedUserListing = true;

  await subscribe(user1, "user1-all", received1);
  await subscribe(user1, "user1-filtered", received1, {
    table: "showings",
    filter: `user_id=eq.${user2.id}`,
  });
  await subscribe(user2, "user2-all", received2);
  console.log("All channels subscribed");
  await sleep(1000);

  // User 2's changes
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: showing, error: insertError } = await user2.client
    .from("showings")
    .insert({ listing_id: listingId, showing_date: date })
    .select("id")
    .single();
  if (insertError || !showing)
    throw new Error(`Insert showing: ${insertError?.message}`);
  showingId = showing.id;

  const { error: updateError } = await user2.client
    .from("showings")
    .update({ note: "realtime test" })
    .eq("id", showingId);
  if (updateError) throw new Error(`Update showing: ${updateError.message}`);

  const { data: profile } = await user2.client
    .from("profiles")
    .select("name")
    .eq("id", user2.id)
    .single();
  const { error: nameError } = await user2.client
    .from("profiles")
    .update({ name: profile!.name })
    .eq("id", user2.id);
  if (nameError) throw new Error(`Update name: ${nameError.message}`);

  const { data: invite, error: inviteError } = await user2.client
    .from("invites")
    .insert({ from_user_id: user2.id, to_email: INVITE_TO })
    .select("id")
    .single();
  if (inviteError || !invite)
    throw new Error(`Insert invite: ${inviteError?.message}`);
  inviteId = invite.id;

  const { error: cancelError } = await user2.client.rpc("cancel_invite", {
    invite_id: inviteId,
  });
  if (cancelError) throw new Error(`Cancel invite: ${cancelError.message}`);

  const { error: deleteError } = await user2.client
    .from("showings")
    .delete()
    .eq("id", showingId);
  if (deleteError) throw new Error(`Delete showing: ${deleteError.message}`);
  showingId = null;

  await sleep(WAIT_MS);
} catch (e) {
  console.error("Test aborted:", e instanceof Error ? e.message : e);
  await cleanup();
  process.exit(1);
}

await cleanup();

// Report
const count = (list: Received[], table: string, event: string) =>
  list.filter((r) => r.table === table && r.event === event).length;

console.log("\nUser 2 (control, own changes):");
for (const [table, event] of [
  ["showings", "INSERT"],
  ["showings", "UPDATE"],
  ["showings", "DELETE"],
  ["invites", "INSERT"],
  ["invites", "UPDATE"],
  ["profiles", "UPDATE"],
] as const) {
  console.log(`  ${table} ${event}: ${count(received2, table, event)}`);
}

const leaked = received1.filter((r) => r.event !== "DELETE");
const deletes1 = received1.filter((r) => r.event === "DELETE");
console.log("\nUser 1 (other user, no shared group):");
console.log(`  INSERT/UPDATE events: ${leaked.length}`);
for (const r of leaked) console.log(`    ${r.channel}: ${r.table} ${r.event}`);
console.log(`  DELETE events (reported only): ${deletes1.length}`);
for (const r of deletes1) {
  console.log(
    `    ${r.channel}: ${r.table}, old record keys: ${r.oldKeys.join(", ") || "(none)"}`,
  );
}

const controlOk =
  count(received2, "showings", "INSERT") > 0 &&
  count(received2, "showings", "UPDATE") > 0 &&
  count(received2, "invites", "INSERT") > 0 &&
  count(received2, "invites", "UPDATE") > 0 &&
  count(received2, "profiles", "UPDATE") > 0;
if (!controlOk) {
  console.log(
    "\nControl failed: user 2 did not receive all its own events, so the result says nothing",
  );
}
const pass = controlOk && leaked.length === 0;
console.log(pass ? "\nRESULT: as expected" : "\nRESULT: NOT as expected");
process.exit(pass ? 0 : 1);
