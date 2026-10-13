import { createClient } from "@supabase/supabase-js";

// Credentials in dotenv
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Error handling
if (!url || !key) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
}

// Create connection to Supabase
export const supabase = createClient(url, key);

// NOTES!
// @react-native-async-storage/async-storage is needed if publishing in app format, needed for Expo Go to work.
