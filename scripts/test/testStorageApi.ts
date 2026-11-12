// This file tests the avatar rules through the Storage API, like the app (bucket and policies: supabase/setup-extras.sql)
// USAGE: node scripts/test/testStorageApi.ts

// Signs in as the two test users with the PUBLISHABLE key, like the app does, and checks that user 1:
//   1. cannot delete, overwrite, move or copy user 2's file, or upload into user 2's folder
//   2. cannot upload a file over 2 MB, a MIME type that is not an image, or a name that is not <own id>/<name>.(jpg|jpeg|png|webp)
//   3. can upload and delete a file in its own folder (control)

// Only files named samboo-test-* are uploaded, and the service role removes them afterwards.
// Profiles (avatar_path) are not changed. Each user needs fewer than 5 files to be allowed to upload.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024; // file_size_limit of the bucket

// A 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

type User = { client: SupabaseClient<Database>; id: string; email: string };

// A normal client as the app would use it, not the admin client
async function signIn(email: string, password: string): Promise<User> {
  const client = createClient<Database>(url!, key!, {
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

const fileB = `${user2.id}/samboo-test-b.png`;
const fileA = `${user1.id}/samboo-test-a.png`;

// Checked with the service role, so RLS does not hide the answer
async function exists(path: string): Promise<boolean> {
  const [folder, name] = path.split("/");
  const { data } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(folder, { search: name });
  return (data ?? []).some((f) => f.name === name);
}

async function countFiles(userId: string): Promise<number> {
  const { data } = await supabaseAdmin.storage.from(BUCKET).list(userId);
  return (data ?? []).length;
}

async function cleanup() {
  for (const userId of [user1.id, user2.id]) {
    const { data } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(userId, { search: "samboo-test" });
    const paths = (data ?? []).map((f) => `${userId}/${f.name}`);
    if (paths.length > 0)
      await supabaseAdmin.storage.from(BUCKET).remove(paths);
  }
}

let passed = 0;
let failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: ${detail}`);
}
const describe = (error: { message: string } | null) =>
  error ? `rejected (${error.message})` : "accepted";

console.log(
  `Files before: user 1 has ${await countFiles(user1.id)}, user 2 has ${await countFiles(user2.id)} (max 5 to upload)\n`,
);

try {
  // Control: user 2 uploads a file of its own
  {
    const { error } = await user2.client.storage
      .from(BUCKET)
      .upload(fileB, PNG, { contentType: "image/png" });
    check("Control: user 2 uploads to own folder", !error, describe(error));
    if (error)
      throw new Error(
        "Control upload failed, the other checks would say nothing",
      );
  }

  // 1. User 1 against user 2's folder
  console.log("\n— User 1 against user 2's folder —");
  {
    const { data, error } = await user1.client.storage
      .from(BUCKET)
      .remove([fileB]);
    const stillThere = await exists(fileB);
    check(
      "Delete user 2's file",
      stillThere,
      `${error ? `error (${error.message})` : `no error, ${data?.length ?? 0} removed`}; file ${stillThere ? "still there" : "GONE"}`,
    );
  }
  {
    const { error } = await user1.client.storage
      .from(BUCKET)
      .upload(fileB, PNG, { contentType: "image/png", upsert: true });
    check("Overwrite user 2's file (upsert)", !!error, describe(error));
  }
  {
    const { error } = await user1.client.storage
      .from(BUCKET)
      .upload(`${user2.id}/samboo-test-new.png`, PNG, {
        contentType: "image/png",
      });
    check("Upload into user 2's folder", !!error, describe(error));
  }
  {
    const { error } = await user1.client.storage
      .from(BUCKET)
      .move(fileB, `${user1.id}/samboo-test-moved.png`);
    check("Move user 2's file to own folder", !!error, describe(error));
  }
  {
    const { error } = await user1.client.storage
      .from(BUCKET)
      .copy(fileB, `${user1.id}/samboo-test-copy.png`);
    check("Copy user 2's file to own folder", !!error, describe(error));
  }
  check(
    "User 2's file is untouched",
    await exists(fileB),
    "checked with the service role",
  );

  // 2. User 1's own folder, wrong size, type or name
  console.log("\n— User 1's own folder, wrong file —");
  {
    const big = Buffer.concat([PNG, Buffer.alloc(MAX_BYTES + 1)]);
    const { error } = await user1.client.storage
      .from(BUCKET)
      .upload(`${user1.id}/samboo-test-big.png`, big, {
        contentType: "image/png",
      });
    check("File over 2 MB", !!error, describe(error));
  }
  {
    const { error } = await user1.client.storage
      .from(BUCKET)
      .upload(
        `${user1.id}/samboo-test-html.png`,
        Buffer.from("<script>alert(1)</script>"),
        {
          contentType: "text/html",
        },
      );
    check("MIME type text/html", !!error, describe(error));
  }
  {
    const { error } = await user1.client.storage
      .from(BUCKET)
      .upload(`${user1.id}/samboo-test-svg.png`, Buffer.from("<svg/>"), {
        contentType: "image/svg+xml",
      });
    check("MIME type image/svg+xml", !!error, describe(error));
  }
  {
    const { error } = await user1.client.storage
      .from(BUCKET)
      .upload(`${user1.id}/samboo-test.html`, PNG, {
        contentType: "image/png",
      });
    check("File name ending in .html", !!error, describe(error));
  }
  {
    const { error } = await user1.client.storage
      .from(BUCKET)
      .upload(`${user1.id}/sub/samboo-test-sub.png`, PNG, {
        contentType: "image/png",
      });
    check("Subfolder", !!error, describe(error));
  }

  // 3. Control: user 1's own file
  console.log("\n— User 1's own folder, valid file —");
  {
    const { error } = await user1.client.storage
      .from(BUCKET)
      .upload(fileA, PNG, { contentType: "image/png" });
    check("Control: upload to own folder", !error, describe(error));
  }
  {
    const { error } = await user1.client.storage.from(BUCKET).remove([fileA]);
    const gone = !(await exists(fileA));
    check(
      "Control: delete own file",
      !error && gone,
      `${describe(error)}; file ${gone ? "gone" : "still there"}`,
    );
  }
} catch (e) {
  console.error("Test aborted:", e instanceof Error ? e.message : e);
  failed++;
} finally {
  await cleanup();
}

console.log(`\n${passed} OK, ${failed} FAIL`);
console.log(failed === 0 ? "RESULT: as expected" : "RESULT: NOT as expected");
process.exitCode = failed === 0 ? 0 : 1;
