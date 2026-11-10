import { getNewMatchesCount } from "@/services/listings";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type CountResult = {
  userId: string;
  count: number;
  failed?: boolean;
};

// How many listings in MY search I have not opened yet, for the "new listings in your search"
// notification. Not newListingIds.size: that also counts group members' likes outside my search.
// Pass undefined until the session is loaded. Refetches every time the page is opened
export function useNewMatchesCount(userId: string | undefined) {
  const [result, setResult] = useState<CountResult | null>(null);
  // true while the fetch of this visit is running. result still holds the previous visit's
  // data meanwhile, so isLoading alone can not tell if the data is up to date
  const [isFetching, setIsFetching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      setIsFetching(true);
      getNewMatchesCount(userId).then(({ count, error }) => {
        if (cancelled) return;
        setIsFetching(false);
        if (error) {
          console.error("Failed to count new matches: ", error);
          setResult({ userId, count: 0, failed: true });
          return;
        }
        setResult({ userId, count: count ?? 0 });
      });

      return () => {
        cancelled = true;
      };
    }, [userId]),
  );

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    newMatchesCount: current?.count ?? 0,
    isLoading: !!userId && !current,
    // true when this visit's fetch has finished successfully
    isReady: !!current && !current.failed && !isFetching,
    error: current?.failed ? "Kunde inte hämta nya bostäder." : null,
  };
}
