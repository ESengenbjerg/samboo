import { getNewListingsCount } from "@/services/listings";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type CountResult = {
  userId: string;
  count: number;
  failed?: boolean;
};

// The number of new (not yet opened) listings in my feed. Pass undefined until the
// session is loaded. Refetches on every focus, so the number drops after I have
// opened listings in the feed and come back to the notifications page
export function useNewListingsCount(userId: string | undefined) {
  const [result, setResult] = useState<CountResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      getNewListingsCount(userId).then(({ count, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to count new listings: ", error);
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
    newListingsCount: current?.count ?? 0,
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta nya bostäder." : null,
  };
}
