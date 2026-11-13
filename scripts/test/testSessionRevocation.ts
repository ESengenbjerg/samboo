// This file tests that a revoked session is blocked at once, not first when its access token expires
// (is_active_user() requires the JWT's session_id to exist in auth.sessions, see supabase/schema.sql)
// USAGE: node scripts/test/testSessionRevocation.ts

// Signs in as the test user twice with the PUBLISHABLE key, like two browsers ("Safari" and "Chrome"), and checks:
//   1. Both sessions can read and write (control). "Chrome" creates a test category, so there is own data to read.
//   2. "Safari" signs out the other sessions, like the app does after a password change.
//   3. "Chrome" still has an unexpired access token, but is blocked at once: the test category is no longer visible,
//      no writes, no Storage upload.
//      getUser() reports the session as gone, and supabase-js removes the local session (what the app relies on to sign out).
//   4. "Safari" keeps working (control).

// Signs out every other session of the test user, so do not run it while signed in with that account elsewhere.
// Writes the user's own name (same value) and a test category, and removes the category and the test file it tries
// to upload (if it got through) afterwards.
// Dev database only.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types.ts";

process.loadEnvFile(".env");

const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY;
const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

if (!url || !key || !email || !password) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL, a publishable key, TEST_USER_EMAIL or TEST_USER_PASSWORD in dotenv",
  );
}

type Client = SupabaseClient<Database>;

// A normal client as the app would use it, not the admin client
async function signIn(
  label: string,
): Promise<{ client: Client; userId: string }> {
  const client = createClient<Database>(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: email!,
    password: password!,
  });
  if (error || !data.user) {
    console.error(`Sign in failed (${label}):`, error);
    process.exit(1);
  }
  return { client, userId: data.user.id };
}

let passed = 0;
let failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: ${detail}`);
}

const TEST_TAG = "rlstest-revoked";

// What the session may do right now
async function probe(client: Client, userId: string) {
  const active = await client.rpc("is_active_user", undefined, { get: true });
  const tag = await client
    .from("user_tags")
    .select("id")
    .eq("user_id", userId)
    .eq("tag_name", TEST_TAG);
  const profile = await client
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();
  const write = await client
    .from("profiles")
    .update({ name: profile.data?.name ?? "Test" })
    .eq("id", userId)
    .select("id");
  return {
    active: active.data === true,
    tagRows: tag.data?.length ?? 0,
    writeRows: write.data?.length ?? 0,
    writeError: write.error?.message ?? null,
  };
}

const safari = await signIn("Safari");
const chrome = await signIn("Chrome");
const userId = safari.userId;
console.log(`Signed in twice as ${email}\n`);

const testFile = `${userId}/samboo-test-revoked.png`;

// Left over from an aborted run
await supabaseAdmin
  .from("user_tags")
  .delete()
  .eq("user_id", userId)
  .eq("tag_name", TEST_TAG);

try {
  // 1. Control: both sessions work, and Chrome has own data to read
  console.log("— Before —");
  const { error: tagError } = await chrome.client
    .from("user_tags")
    .insert({ user_id: userId, tag_name: TEST_TAG });
  check(
    "Chrome creates a test category",
    !tagError,
    tagError ? tagError.message : "ok",
  );
  const s0 = await probe(safari.client, userId);
  const c0 = await probe(chrome.client, userId);
  check("Safari is active", s0.active, `is_active_user() = ${s0.active}`);
  check("Chrome is active", c0.active, `is_active_user() = ${c0.active}`);
  check(
    "Chrome can read the test category",
    c0.tagRows === 1,
    `${c0.tagRows} row(s)`,
  );
  check(
    "Chrome can write",
    c0.writeRows === 1,
    `${c0.writeRows} row(s) updated`,
  );

  // 2. Safari signs out the other sessions
  const { error: signOutError } = await safari.client.auth.signOut({
    scope: "others",
  });
  check(
    "Safari signs out other sessions",
    !signOutError,
    signOutError ? signOutError.message : "ok",
  );

  // 3. Chrome, with its old but unexpired access token
  console.log("\n— Chrome right after, same access token —");
  const c1 = await probe(chrome.client, userId);
  check("is_active_user()", !c1.active, `${c1.active}`);
  check(
    "Read the test category",
    c1.tagRows === 0,
    `${c1.tagRows} row(s)`,
  );
  const { count: tagsInDb } = await supabaseAdmin
    .from("user_tags")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("tag_name", TEST_TAG);
  check(
    "The test category still exists (hidden, not deleted)",
    tagsInDb === 1,
    `${tagsInDb ?? 0} row(s) with the service role`,
  );
  check(
    "Write own profile",
    c1.writeRows === 0,
    c1.writeError
      ? `rejected (${c1.writeError})`
      : `${c1.writeRows} row(s) updated`,
  );
  const upload = await chrome.client.storage
    .from("avatars")
    .upload(testFile, Buffer.from("x"), { contentType: "image/png" });
  check(
    "Upload avatar",
    !!upload.error,
    upload.error ? `rejected (${upload.error.message})` : "accepted",
  );
  const user = await chrome.client.auth.getUser();
  check(
    "getUser() reports the session as gone",
    !!user.error,
    user.error
      ? `error ${user.error.status ?? ""} ${user.error.code ?? ""}: ${user.error.message}`
      : "still a valid user",
  );
  const local = await chrome.client.auth.getSession();
  check(
    "supabase-js removed the local session",
    local.data.session === null,
    local.data.session ? "session still stored" : "no session",
  );

  // 4. Control: Safari still works
  console.log("\n— Safari after —");
  const s1 = await probe(safari.client, userId);
  check("is_active_user()", s1.active, `${s1.active}`);
  check(
    "Write own profile",
    s1.writeRows === 1,
    `${s1.writeRows} row(s) updated`,
  );
} catch (e) {
  console.error("Test aborted:", e instanceof Error ? e.message : e);
  failed++;
} finally {
  await supabaseAdmin.storage.from("avatars").remove([testFile]);
  await supabaseAdmin
    .from("user_tags")
    .delete()
    .eq("user_id", userId)
    .eq("tag_name", TEST_TAG);
  await safari.client.auth.signOut({ scope: "local" });
}

console.log(`\n${passed} OK, ${failed} FAIL`);
console.log(failed === 0 ? "RESULT: as expected" : "RESULT: NOT as expected");
process.exitCode = failed === 0 ? 0 : 1;
