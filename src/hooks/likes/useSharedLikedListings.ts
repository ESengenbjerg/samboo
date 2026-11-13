import { getSharedLikedListings } from "@/services/listings";
import { Listing } from "@/types/listing";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type SharedLikedListingsResult = {
  userId: string;
  listings: Listing[];
  failed?: boolean;
};

// The shared list ("Gemensam lista"): listings that every member of my group has liked.
// Empty if I am not in a group. Pass undefined until the session is loaded
export function useSharedLikedListings(userId: string | undefined) {
  const [result, setResult] = useState<SharedLikedListingsResult | null>(null);

  // Reloads every time the screen comes into focus

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      getSharedLikedListings().then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load shared liked listings: ", error);
          setResult({ userId, listings: [], failed: true });
          return;
        }
        setResult({ userId, listings: data ?? [] });
      });

      return () => {
        cancelled = true;
      };
    }, [userId]),
  );

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    listings: current?.listings ?? [],
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta den gemensamma listan." : null,
  };
}
