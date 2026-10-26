// Deletes avatar files in Storage that no profile points to:
// replaced images, abandoned uploads and images of deleted accounts (GDPR).
//
// The database decides WHICH files are orphans (public.orphan_avatar_objects(), files older than 1 hour
// that no profiles.avatar_path points to). This script only deletes them through the Storage API.
// Files must not be deleted with SQL on storage.objects: that leaves the file in the bucket.

process.loadEnvFile(".env");

const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

const BUCKET = "avatars";
// Storage remove() accepts at most 1000 paths per call
const BATCH_SIZE = 1000;

const { data, error } = await supabaseAdmin.rpc("orphan_avatar_objects");

if (error) {
  console.error("Could not list orphan avatars:", error.message);
  process.exit(1);
}

const orphans = ((data ?? []) as { object_name: string }[]).map(
  (row) => row.object_name,
);
console.log(`Found ${orphans.length} orphan avatar file(s)`);

let deleted = 0;

for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
  const batch = orphans.slice(i, i + BATCH_SIZE);
  const { data: removed, error: removeError } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove(batch);

  if (removeError) {
    console.error("Could not delete avatars:", removeError.message);
    process.exitCode = 1;
    break;
  }
  deleted += removed?.length ?? 0;
}

console.log(`Deleted ${deleted} avatar file(s)`);
