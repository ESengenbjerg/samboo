import AsyncStorage from "@react-native-async-storage/async-storage";
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

// Expo Router renders web pages in Node (SSR), where window does not exist
const isServer = typeof window === "undefined";

// AsyncStorage uses window on web, so do nothing on the server
const storage = {
  getItem: (key: string) => (isServer ? null : AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    isServer ? undefined : AsyncStorage.setItem(key, value),
  removeItem: (key: string) =>
    isServer ? undefined : AsyncStorage.removeItem(key),
};

// Create connection to Supabase.
// Note: createClient also sets up the realtime client, which needs the global
// WebSocket that only exists in Node 22+. The static web export (`output: "static"`)
// runs this file in Node, so building for web fails on older Node versions (see .nvmrc).
export const supabase = createClient(url, key, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: !isServer,
    detectSessionInUrl: false,
  }
});

// NOTES!
// @react-native-async-storage/async-storage is needed if publishing in app format, needed for Expo Go to work.
