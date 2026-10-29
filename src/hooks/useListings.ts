import { getActiveListings } from "@/services/listings";
import { Listing } from "@/types/listing";
import { useEffect, useState } from "react";

type ListingsResult = {
  userId: string;
  listings: Listing[];
  failed?: boolean;
};

// The listings matched to the logged in user (the search feed). Pass undefined until the session is loaded
export function useListings(userId: string | undefined) {
  const [result, setResult] = useState<ListingsResult | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Ignore the response if the user changed or the component unmounted
    let cancelled = false;

    getActiveListings(userId).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Failed to load listings: ", error);
        setResult({ userId, listings: [], failed: true });
        return;
      }
      setResult({ userId, listings: data.map((row) => row.listings) });
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    listings: current?.listings ?? [],
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta bostäder." : null,
  };
}
