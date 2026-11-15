// Storage bucket for profile images, used by the app (upload, URL, delete) and scripts/avatars (purge).
// The database names it too, as text that can not import this file: supabase/setup-extras.sql (the bucket
// and its policies) and the functions in supabase/schema.sql that read storage.objects. Rename them together.
export const AVATAR_BUCKET = "avatars";
