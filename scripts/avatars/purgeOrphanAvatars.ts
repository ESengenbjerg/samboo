// Deletes avatar files in Storage that no profile points to. For performance & GDPR
// Files needs to be older than 1 hour & no profiles.avatar_path points to. This script only deletes them through the Storage API.
import { AVATAR_BUCKET } from "../../shared/storage.ts";

process.loadEnvFile(".env");

// Imported after loadEnvFile
const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

// Storage remove() limit/call
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
    .from(AVATAR_BUCKET)
    .remove(batch);

  if (removeError) {
    console.error("Could not delete avatars:", removeError.message);
    process.exitCode = 1;
    break; // Stop here: the next batches would probably fail too. The next run picks up what is left
  }
  deleted += removed?.length ?? 0; // null -> 0
}

// Will be visible in the GitHub log
console.log(`Deleted ${deleted} avatar file(s)`);
