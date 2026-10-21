// This file aims to test the per-user write limit (check_request(), see supabase/schema.sql)

// Signs in as the seed user (Admin) with the PUBLISHABLE key, like the app does, and sends write requests in a loop.
// A write is an update of the user's own profile name to the value it already has, so nothing changes.
// Expected: the first 100 writes in a 5 minute window succeed, the following ones are rejected with HTTP 429.
// A read after the loop should still succeed (reads are not limited).
// The counters are per minute and the window is about 5 minutes, so wait that long before running it again.

import { createClient } from "@supabase/supabase-js";

// Fetch credentials in dotenv
process.loadEnvFile(".env");

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY;
const email = process.env.SEED_USER_EMAIL;
const password = process.env.SEED_USER_PASSWORD;

if (!url || !key || !email || !password) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL, a publishable key, SEED_USER_EMAIL or SEED_USER_PASSWORD in dotenv",
  );
}

// A normal client as the app would use it, not the admin client
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: signIn, error: signInError } =
  await supabase.auth.signInWithPassword({ email, password });

if (signInError || !signIn.user) {
  console.error("Sign in failed:", signInError);
  process.exit(1);
}

const userId = signIn.user.id;
console.log(`Signed in as ${email}`);

// Read the current name (a read, not counted)
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("name")
  .eq("id", userId)
  .single();

if (profileError || !profile) {
  console.error("Could not read the profile:", profileError);
  process.exit(1);
}

const TOTAL = 105; // The limit is 100, so the last 5 should be rejected
let succeeded = 0;
let rejected = 0;
let firstRejected: number | null = null;
let firstMessage = "";
let otherErrors = 0;

for (let i = 1; i <= TOTAL; i++) {
  const { error, status } = await supabase
    .from("profiles")
    .update({ name: profile.name })
    .eq("id", userId);

  if (!error) {
    succeeded++;
  } else if (status === 429) {
    rejected++;
    if (firstRejected === null) {
      firstRejected = i;
      firstMessage = error.message;
    }
  } else {
    otherErrors++;
    console.error(`Request ${i}: unexpected error (status ${status}):`, error);
  }
}

console.log(`\nWrites sent: ${TOTAL}`);
console.log(`  succeeded:       ${succeeded}`);
console.log(`  rejected (429):  ${rejected}`);
console.log(`  other errors:    ${otherErrors}`);
if (firstRejected !== null) {
  console.log(
    `  first rejected:  request ${firstRejected} ("${firstMessage}")`,
  );
}

// A read must still work after the limit has been hit
const { error: readError, status: readStatus } = await supabase
  .from("profiles")
  .select("name")
  .eq("id", userId)
  .single();

console.log(
  `\nRead after the loop: ${readError ? `FAILED (status ${readStatus})` : "ok"}`,
);

const pass =
  succeeded === 100 &&
  rejected === TOTAL - 100 &&
  otherErrors === 0 &&
  !readError;
console.log(pass ? "\nRESULT: as expected" : "\nRESULT: NOT as expected");
process.exitCode = pass ? 0 : 1;

// Ran in Terminal:
// node scripts/users/testRateLimit.ts

// Result:
// Signed in as admin@samboo.com

// Writes sent: 105
//   succeeded:       100
//   rejected (429):  5
//   other errors:    0
//   first rejected:  request 101 ("Too many requests, try again in a moment")

// Read after the loop: ok

// RESULT: as expected
