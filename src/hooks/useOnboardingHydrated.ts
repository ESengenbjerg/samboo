import { useOnboardingStore } from "@/stores/onboarding";
import { useSyncExternalStore } from "react";

// Subscribes to the hydration-finished event. Returns the unsubscribe function
function subscribe(onChange: () => void) {
  return useOnboardingStore.persist.onFinishHydration(onChange);
}

export function useOnboardingHydrated() {
  // Tracks whether zustand's persist middleware has finished loading
  // the saved state from AsyncStorage. Re-renders when hydration finishes.
  return useSyncExternalStore(
    subscribe,
    () => useOnboardingStore.persist.hasHydrated(),
    // Web static rendering: nothing is hydrated on the server
    () => false,
  );
}
