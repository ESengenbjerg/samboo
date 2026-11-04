import { getLikedListings } from "@/services/listings";
import { Listing } from "@/types/listing";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type LikedListingsResult = {
  userId: string;
  listings: Listing[];
  failed?: boolean;
};

// Reloads every time the screen comes into focus, so a like made on another
// screen shows up when the user comes back to this one
export function useLikedListings(userId: string | undefined) {
  const [result, setResult] = useState<LikedListingsResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      getLikedListings(userId).then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load liked listings: ", error);
          setResult({ userId, listings: [], failed: true });
          return;
        }
        setResult({ userId, listings: data.map((row) => row.listings) });
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
    error: current?.failed ? "Kunde inte hämta din lista." : null,
  };
}
