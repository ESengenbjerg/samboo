import { useOnboardingStore } from "@/stores/onboarding";
import { useEffect, useState } from "react";

export function useOnboardingHydrated() {
  // Tracks whether zustand's persist middleware has finished loading
  // the saved state from AsyncStorage. Initialized with the current status,
  // since hydration may already be complete on first render.
  const [hasHydrated, setHasHydrated] = useState(
    useOnboardingStore.persist.hasHydrated(),
  );

  useEffect(() => {
    // Subscribe to the hydration-finished event so the component re-renders
    // when AsyncStorage has been read (hydration is async and may finish late).
    const unsub = useOnboardingStore.persist.onFinishHydration(() =>
      setHasHydrated(true),
    );
    // Covers the case where hydration finished between the first render
    // and this effect, so the event would never fire.
    setHasHydrated(useOnboardingStore.persist.hasHydrated());
    return unsub;
  }, []);

  return hasHydrated;
}
