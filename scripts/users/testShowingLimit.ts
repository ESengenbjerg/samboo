// This file aims to test the limit of 50 showings per owner (limit_showings_per_group(), see supabase/schema.sql)

// Runs the same test twice with temporary users created through the Auth Admin API (no e-mail is sent):
//   1. a solo user (no group): showings belong to the user
//   2. a group of two users: showings belong to the group
// For each owner it inserts 51 showings through the PUBLISHABLE key, like the app does.
// Expected: the first 50 succeed, the 51st is rejected ("Du har redan max antal visningar (50)" for a solo user,
// "Gruppen har redan max antal visningar (50)" for a group), and exactly 50 showings are stored.
// 51 temporary listings are created and linked to the users, because the app only lets you add a showing for a listing you can see.
// Everything (users, listings, showings) is deleted at the end, also if the test fails halfway.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

const MAX = 50;
const TOTAL = MAX + 1;
const password = `Test-${crypto.randomUUID()}`;
const runId = Date.now();
const agency = `showing-limit-test-${runId}`;

const createdUserIds: string[] = [];
let listingIds: number[] = [];
let passSolo = false;
let passGroup = false;

async function createUser(label: string) {
  const email = `showing-limit-${label}-${runId}@example.com`;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: `ShowingTest ${label}` },
  });
  if (error || !data.user) {
    throw new Error(`Could not create user ${label}: ${error?.message}`);
  }
  createdUserIds.push(data.user.id);

  // A normal client as the app would use it
  const client = createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw new Error(`Sign in failed for ${label}: ${signInError.message}`);

  return { id: data.user.id, email, client };
}

// Inserts TOTAL showings and checks that only the last one is rejected, with the right message
async function runInserts(
  client: SupabaseClient,
  expectedMessage: string,
) {
  let succeeded = 0;
  let rejected = 0;
  let rejectedAt: number | null = null;
  let message = "";
  let otherErrors = 0;

  for (let i = 0; i < TOTAL; i++) {
    const { error } = await client.from("showings").insert({
      listing_id: listingIds[i],
      showing_date: "2099-01-01",
    });
    if (!error) {
      succeeded++;
    } else if (error.message.includes(expectedMessage)) {
      rejected++;
      rejectedAt ??= i + 1;
      message = error.message;
    } else {
      otherErrors++;
      console.error(`  insert ${i + 1}: unexpected error:`, error.message);
    }
  }

  console.log(`  succeeded:      ${succeeded}`);
  console.log(`  rejected:       ${rejected}${rejectedAt ? ` (first at insert ${rejectedAt}: "${message}")` : ""}`);
  console.log(`  other errors:   ${otherErrors}`);

  return (
    succeeded === MAX &&
    rejected === 1 &&
    rejectedAt === TOTAL &&
    otherErrors === 0
  );
}

try {
  // 51 temporary listings, shared by both tests
  const { data: listings, error: listingsError } = await supabaseAdmin
    .from("listings")
    .insert(
      Array.from({ length: TOTAL }, (_, i) => ({
        agency,
        external_id: i + 1,
        url: `https://example.com/${agency}/${i + 1}`,
        ld_json: {},
      })),
    )
    .select("id");
  if (listingsError || !listings) {
    throw new Error(`Could not create listings: ${listingsError?.message}`);
  }
  listingIds = listings.map((l) => l.id);
  console.log(`Created ${listingIds.length} test listings`);

  const solo = await createUser("solo");
  const memberA = await createUser("groupA");
  const memberB = await createUser("groupB");

  // Link the listings to the users so they are allowed to see them (listings_select_matched).
  // For the group, one member is enough: the policy also covers listings matched to someone in the same group.
  const { error: linkError } = await supabaseAdmin.from("user_listings").insert(
    [solo.id, memberA.id].flatMap((user_id) =>
      listingIds.map((listing_id) => ({ user_id, listing_id })),
    ),
  );
  if (linkError) throw new Error(`Could not link listings: ${linkError.message}`);

  // Make A and B a group
  const { error: inviteError } = await memberA.client
    .from("invites")
    .insert({ from_user_id: memberA.id, to_email: memberB.email });
  if (inviteError) throw new Error(`Invite failed: ${inviteError.message}`);
  const { data: invite, error: inviteReadError } = await memberB.client
    .from("invites")
    .select("id")
    .eq("status", "pending")
    .single();
  if (inviteReadError || !invite) {
    throw new Error(`B cannot see the invite: ${inviteReadError?.message}`);
  }
  const { error: acceptError } = await memberB.client.rpc("accept_invite", {
    invite_id: invite.id,
  });
  if (acceptError) throw new Error(`Accept failed: ${acceptError.message}`);
  console.log("Created a group of two\n");

  console.log("Solo user (own showings):");
  passSolo = await runInserts(solo.client, "max antal visningar");
  const { count: soloCount } = await supabaseAdmin
    .from("showings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", solo.id);
  console.log(`  stored:         ${soloCount}`);
  passSolo &&= soloCount === MAX;

  console.log("\nGroup (group's showings, inserted as member B):");
  passGroup = await runInserts(memberB.client, "max antal visningar");
  const { data: groupRow } = await supabaseAdmin
    .from("profiles")
    .select("group_id")
    .eq("id", memberA.id)
    .single();
  const { count: groupCount } = await supabaseAdmin
    .from("showings")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupRow?.group_id ?? -1);
  console.log(`  stored:         ${groupCount}`);
  passGroup &&= groupCount === MAX;
} catch (err) {
  console.error(err);
} finally {
  // Listings first (cascades to showings and user_listings), then the users (the group is dissolved by the delete trigger)
  if (listingIds.length > 0) {
    const { error } = await supabaseAdmin
      .from("listings")
      .delete()
      .eq("agency", agency);
    if (error) console.error("Could not delete test listings:", error.message);
  }
  for (const id of createdUserIds) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) console.error(`Could not delete test user ${id}:`, error.message);
  }
  console.log(`\nDeleted ${listingIds.length} test listings and ${createdUserIds.length} test users`);
}

console.log(`\nSolo user: ${passSolo ? "as expected" : "NOT as expected"}`);
console.log(`Group:     ${passGroup ? "as expected" : "NOT as expected"}`);
process.exitCode = passSolo && passGroup ? 0 : 1;

// Run in Terminal:
// node scripts/users/testShowingLimit.ts
