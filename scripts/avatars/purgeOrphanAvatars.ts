// Deletes avatar files in Storage that no profile points to:
// replaced images, abandoned uploads and images of deleted accounts (GDPR).
//
// The database decides WHICH files are orphans (public.orphan_avatar_objects(), files older than 1 hour
// that no profiles.avatar_path points to). This script only deletes them through the Storage API.
// Files must not be deleted with SQL on storage.objects: that leaves the file in the bucket.

process.loadEnvFile(".env");

// Imported here, after loadEnvFile: the admin client reads the keys when it is imported
const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

const BUCKET = "avatars";
// Delete a maximum of 1000 files per call (limit set by Storage remove() in the API). This amount of removed files probably won't happen in this application.
const BATCH_SIZE = 1000;

// Find unused files to delete
const { data, error } = await supabaseAdmin.rpc("orphan_avatar_objects");

// If something goes wrong
if (error) {
  console.error("Could not list orphan avatars:", error.message);
  process.exit(1); // Exit code 1 makes the workflow run fail (red) in GitHub
}

// Turn the rows into a plain list of file names
// If data = null, use an empty array
const orphans = ((data ?? []) as { object_name: string }[]).map(
  (row) => row.object_name,
);
console.log(`Found ${orphans.length} orphan avatar file(s)`);

let deleted = 0;

// A loop is used to not crash if > 1000 would occur
for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
  const batch = orphans.slice(i, i + BATCH_SIZE);
  const { data: removed, error: removeError } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove(batch);

  if (removeError) {
    // Will be visible in the GitHub log
    console.error("Could not delete avatars:", removeError.message);
    process.exitCode = 1;
    break; // Stop here: the next batches would probably fail too. The next run picks up what is left
  }
  deleted += removed?.length ?? 0; // null -> 0
}

// Will be visible in the GitHub log
console.log(`Deleted ${deleted} avatar file(s)`);
