import { createClient } from "@supabase/supabase-js";

// Server-side only! The service role key bypasses RLS.
// Never import this from the app, and never prefix the key with EXPO_PUBLIC_.
// Requires process.loadEnvFile(".env") to have run before this file is imported.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// No user session needed in a script
export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
