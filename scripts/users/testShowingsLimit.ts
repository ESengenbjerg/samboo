// This file aims to test the limit of 50 showings (limit_showings_per_group(), see supabase/schema.sql)

// Signs in as the two seed users with the PUBLISHABLE key, like the app does, and checks:
//   1. Each user can add 50 personal showings, and the 51st is rejected ("Du har redan max antal visningar (50)").
//   2. The users join one group (invite + accept_invite()). Their showings move into it: 100 in the group,
//      because the limit is only checked on insert.
//   3. Adding one more showing to the group is rejected ("Gruppen har redan max antal visningar (50)").
//
// It RESETS the seed users first: both leave their group and ALL their showings are deleted.
// It adds user_listings rows for the listings it uses (so the users may see them) and removes only those afterwards.
// Dev database only. Needs 102 listings that are not removed.
//
// Each user sends about 55 writes. The limit is 100 per 5 minutes (check_request()), so wait that long before running it again.
// Usage: node scripts/users/testShowingsLimit.ts

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

process.loadEnvFile(".env");

const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY;
const email1 = process.env.SEED_USER_EMAIL;
const password1 = process.env.SEED_USER_PASSWORD;
const email2 = process.env.SEED_USER2_EMAIL;
const password2 = process.env.SEED_USER2_PASSWORD;

if (!url || !key || !email1 || !password1 || !email2 || !password2) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL, a publishable key or the SEED_USER / SEED_USER2 credentials in dotenv",
  );
}

const LIMIT = 50;

type User = { client: SupabaseClient; id: string; email: string };

// A normal client as the app would use it, not the admin client
async function signIn(email: string, password: string): Promise<User> {
  const client = createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    console.error(`Sign in failed for ${email}:`, error);
    process.exit(1);
  }
  return { client, id: data.user.id, email };
}

const user1 = await signIn(email1, password1);
const user2 = await signIn(email2, password2);
console.log(`Signed in as ${user1.email} and ${user2.email}`);

// A week ahead, so the purge job (30 days after the date) does not touch the rows
const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

// The listings: 50 for user 1, 50 for user 2, one extra for the 51st personal showing, one for the 101st in the group
const { data: listings, error: listingsError } = await supabaseAdmin
  .from("listings")
  .select("id")
  .is("removed_at", null)
  .order("id")
  .limit(2 * LIMIT + 2);

if (listingsError || !listings || listings.length < 2 * LIMIT + 2) {
  console.error(
    `Need ${2 * LIMIT + 2} listings that are not removed, found ${listings?.length ?? 0}:`,
    listingsError ?? "",
  );
  process.exit(1);
}

const ids = listings.map((l) => l.id as number);
const forUser1 = ids.slice(0, LIMIT);
const forUser2 = ids.slice(LIMIT, 2 * LIMIT);
const extraPersonal = ids[2 * LIMIT];
const extraGroup = ids[2 * LIMIT + 1];

// Both users must be allowed to see the listings they use (can_see_listing() reads user_listings).
// Remember which rows were added, so only those are removed again.
const wanted = [
  ...[...forUser1, extraPersonal, extraGroup].map((listing_id) => ({
    user_id: user1.id,
    listing_id,
  })),
  ...forUser2.map((listing_id) => ({ user_id: user2.id, listing_id })),
];
const { data: already } = await supabaseAdmin
  .from("user_listings")
  .select("user_id, listing_id")
  .in("user_id", [user1.id, user2.id])
  .in("listing_id", ids);
const alreadyKeys = new Set(
  (already ?? []).map((r) => `${r.user_id}:${r.listing_id}`),
);
const added = wanted.filter((r) => !alreadyKeys.has(`${r.user_id}:${r.listing_id}`));

let inviteId: number | null = null;

// Both leave their group (the group dissolves when one is left), then every showing of the two is deleted
async function reset() {
  for (const user of [user1, user2]) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("group_id")
      .eq("id", user.id)
      .single();
    if (profile?.group_id) {
      const { error } = await user.client.rpc("leave_group");
      if (error) console.error(`leave_group failed for ${user.email}:`, error);
    }
  }
  await supabaseAdmin
    .from("showings")
    .delete()
    .in("user_id", [user1.id, user2.id]);
}

async function cleanup() {
  await reset();
  if (inviteId !== null) {
    await supabaseAdmin.from("invites").delete().eq("id", inviteId);
  }
  for (const user of [user1, user2]) {
    const mine = added
      .filter((r) => r.user_id === user.id)
      .map((r) => r.listing_id);
    if (mine.length > 0) {
      await supabaseAdmin
        .from("user_listings")
        .delete()
        .eq("user_id", user.id)
        .in("listing_id", mine);
    }
  }
}

// Adds one showing as the user (group_id / user_id are filled in by the database)
function addShowing(user: User, listing_id: number) {
  return user.client
    .from("showings")
    .insert({ listing_id, showing_date: date });
}

const results: { name: string; pass: boolean; detail: string }[] = [];
function check(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "ok  " : "FAIL"} ${name}${pass ? "" : `: ${detail}`}`);
}

try {
  await reset();
  if (added.length > 0) {
    const { error } = await supabaseAdmin.from("user_listings").insert(added);
    if (error) throw new Error(`Could not add user_listings: ${error.message}`);
  }

  // 1. 50 personal showings each, then the 51st is rejected
  for (const [user, own] of [
    [user1, forUser1],
    [user2, forUser2],
  ] as const) {
    let failed = 0;
    let firstError = "";
    for (const listing_id of own) {
      const { error } = await addShowing(user, listing_id);
      if (error) {
        failed++;
        firstError ||= error.message;
      }
    }
    check(
      `${user.email}: ${LIMIT} personal showings accepted`,
      failed === 0,
      `${failed} failed, first: ${firstError}`,
    );
  }

  const { error: tooMany } = await addShowing(user1, extraPersonal);
  check(
    "51st personal showing rejected",
    tooMany?.message === "Du har redan max antal visningar (50)",
    `got: ${tooMany?.message ?? "no error"}`,
  );

  // 2. Join one group: user 1 invites user 2, user 2 accepts
  const { error: inviteError } = await user1.client
    .from("invites")
    .insert({ from_user_id: user1.id, to_email: user2.email.toLowerCase() });
  if (inviteError) throw new Error(`Invite failed: ${inviteError.message}`);

  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("id")
    .eq("from_user_id", user1.id)
    .eq("status", "pending")
    .order("id", { ascending: false })
    .limit(1)
    .single();
  inviteId = invite?.id ?? null;

  const { data: dropped, error: acceptError } = await user2.client.rpc(
    "accept_invite",
    { invite_id: inviteId },
  );
  if (acceptError) throw new Error(`accept_invite failed: ${acceptError.message}`);
  check(
    "no showings dropped when joining",
    Array.isArray(dropped) && dropped.length === 0,
    JSON.stringify(dropped),
  );

  const { data: member } = await supabaseAdmin
    .from("profiles")
    .select("group_id")
    .eq("id", user1.id)
    .single();
  const { count } = await supabaseAdmin
    .from("showings")
    .select("*", { count: "exact", head: true })
    .eq("group_id", member?.group_id);
  check(
    "group holds 100 showings (limit is only checked on insert)",
    count === 2 * LIMIT,
    `got ${count}`,
  );

  // 3. One more in the group is rejected
  const { error: groupTooMany } = await addShowing(user1, extraGroup);
  check(
    "101st showing in the group rejected",
    groupTooMany?.message === "Gruppen har redan max antal visningar (50)",
    `got: ${groupTooMany?.message ?? "no error"}`,
  );
} catch (e) {
  console.error("\nTest stopped:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await cleanup();
  console.log("\nCleaned up (groups, showings, invite and added user_listings)");
}

const pass = results.length > 0 && results.every((r) => r.pass);
console.log(pass ? "\nRESULT: as expected" : "\nRESULT: NOT as expected");
process.exitCode = pass && !process.exitCode ? 0 : 1;

// Ran in Terminal:
// node scripts/users/testShowingsLimit.ts
