// This file aims to give the seed user (SEED_USER_EMAIL) 50 showings, so the limit of 50 can be tried in the app once it has a UI.

// Uses the admin client (bypasses RLS), but the trigger limit_showings_per_group() still runs, so it never goes above 50.
// The showings go to the user's group if the user is in one, otherwise to the user.
// Safe to run again: it only adds what is missing up to 50, on listings that do not have a showing yet.
// Usage: node scripts/users/seedShowings.ts

process.loadEnvFile(".env");

const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

const TARGET = 50;

const email = process.env.SEED_USER_EMAIL;
if (!email) {
  throw new Error("Missing SEED_USER_EMAIL in dotenv");
}

// Find the user (the e-mail lives in auth.users, not in profiles)
const { data: userList, error: listError } =
  await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
const authUser = userList?.users.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase(),
);

if (listError || !authUser) {
  console.error("Could not find the seed user:", listError ?? email);
  process.exit(1);
}

const { data: profile, error: profileError } = await supabaseAdmin
  .from("profiles")
  .select("id, group_id")
  .eq("id", authUser.id)
  .single();

if (profileError || !profile) {
  console.error("Could not find the seed user's profile:", profileError);
  process.exit(1);
}

// The owner of a showing is the group, or the user if without a group (exactly one of them is set)
const owner = {
  group_id: profile.group_id ?? null,
  user_id: profile.group_id ? null : profile.id,
};
const ownerColumn = profile.group_id ? "group_id" : "user_id";
const ownerId = profile.group_id ?? profile.id;

const { data: existing, error: existingError } = await supabaseAdmin
  .from("showings")
  .select("listing_id")
  .eq(ownerColumn, ownerId);

if (existingError) {
  console.error("Could not read the existing showings:", existingError);
  process.exit(1);
}

const missing = TARGET - existing.length;
if (missing <= 0) {
  console.log(`Already has ${existing.length} showings, nothing to add`);
  process.exit(0);
}

// Listings that do not have a showing for this owner yet
const taken = new Set(existing.map((s) => s.listing_id));
const { data: listings, error: listingsError } = await supabaseAdmin
  .from("listings")
  .select("id")
  .is("removed_at", null)
  .order("id")
  .limit(TARGET + taken.size);

if (listingsError) {
  console.error("Could not read the listings:", listingsError);
  process.exit(1);
}

const free = listings.filter((l) => !taken.has(l.id)).slice(0, missing);
if (free.length < missing) {
  console.error(
    `Only ${free.length} free listings, need ${missing}. Run the (mock) scraper first.`,
  );
  process.exit(1);
}

// One week ahead, so the purge job (30 days after the date) does not touch them
const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

const rows = free.map((l, i) => ({
  ...owner,
  listing_id: l.id,
  showing_date: date,
  note: `Seed showing ${existing.length + i + 1}`,
}));

// One by one: the 50 limit is checked per insert and locks the owner while counting
for (const row of rows) {
  const { error } = await supabaseAdmin.from("showings").insert(row);
  if (error) {
    console.error(`Insert failed for listing ${row.listing_id}:`, error);
    process.exit(1);
  }
}

console.log(`Added ${rows.length} showings for ${email} (now ${TARGET})`);
