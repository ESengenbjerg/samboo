import { router } from "expo-router";

export default function handleBack() {
  if (router.canGoBack()) {
    return router.back();
  } else {
    // Fallback to search feed
    router.replace("/(tabs)/search");
  }
}
