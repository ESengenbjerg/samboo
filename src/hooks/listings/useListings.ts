import { getActiveListings } from "@/services/listings";
import { MatchedListing } from "@/types/listing";
import { toMatchedListing } from "@/utils/to-matched-listing";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type ListingsResult = {
  userId: string;
  listings: MatchedListing[];
  failed?: boolean;
};

// The listings matched to the logged in user (the search feed). Pass undefined until the session is loaded
export function useListings(userId: string | undefined) {
  const [result, setResult] = useState<ListingsResult | null>(null);

  // Refetch on every focus, so matches updated by a saved filter show up
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      getActiveListings(userId).then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load listings: ", error);
          setResult({ userId, listings: [], failed: true });
          return;
        }
        setResult({ userId, listings: data.map(toMatchedListing) });
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
    error: current?.failed ? "Kunde inte hämta bostäder." : null,
  };
}
