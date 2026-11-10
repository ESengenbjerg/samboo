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
  // true while the fetch of this visit is running. result still holds the previous visit's
  // data meanwhile, so isLoading alone can not tell if the data is up to date
  const [isFetching, setIsFetching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      // The database knows who I am from the session. userId is only used to refetch
      // and to never show a previous user's result
      setIsFetching(true);
      getNewListingIds().then(({ data, error }) => {
        if (cancelled) return;
        setIsFetching(false);
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
    // true when this visit's fetch has finished successfully
    isReady: !!current && !current.failed && !isFetching,
    error: current?.failed ? "Kunde inte hämta nya bostäder." : null,
  };
}
