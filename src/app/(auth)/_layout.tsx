import { Stack } from "expo-router";

// Without an index route the first screen alphabetically (forgotten-password) would be the initial one
export const unstable_settings = {
  anchor: "login",
};

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
