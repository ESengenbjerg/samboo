import { Stack } from "expo-router";

// Without an index route the first screen alphabetically (forgotten-password) would be the initial one
export const unstable_settings = {
  anchor: "profile",
};

export default function OnboardingLayout() {
    return <Stack screenOptions={{ headerShown: false }} />
}