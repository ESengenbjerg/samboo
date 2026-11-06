import { getNewListingIds } from "@/services/listings";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type NewListingIdsResult = {
  userId: string;
  ids: Set<number>;
  failed?: boolean;
};

// Shared empty set, so the value does not change on every render while loading
const EMPTY = new Set<number>();

// The ids (listings.id) of the listings I have not opened yet. Check a listing with
// newListingIds.has(listing.id), in any list: my feed, my list, the shared list or a
// group member's list. Pass undefined until the session is loaded.
// Refetches on every focus, so a listing opened on another screen is no longer new
export function useNewListingIds(userId: string | undefined) {
  const [result, setResult] = useState<NewListingIdsResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      getNewListingIds(userId).then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load new listings: ", error);
          setResult({ userId, ids: EMPTY, failed: true });
          return;
        }
        setResult({ userId, ids: new Set(data.map((r) => r.listing_id)) });
      });

      return () => {
        cancelled = true;
      };
    }, [userId]),
  );

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    newListingIds: current?.ids ?? EMPTY,
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta nya bostäder." : null,
  };
}
