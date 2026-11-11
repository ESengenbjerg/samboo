import { toScheduledShowing } from "@/hooks/showings/useShowings";
import { getShowingForListing } from "@/services/showings";
import { ScheduledShowing } from "@/types/showings";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type Result = { listingId: number; showing: ScheduledShowing | null };

// The existing showing (mine or my group's) for a listing, or null.
// refetch() returns the showing it found, so callers can act on it at once
export function useShowingForListing(listingId: number) {
  const [result, setResult] = useState<Result | null>(null);

  const refetch = useCallback(async () => {
    const { data, error } = await getShowingForListing(listingId);
    if (error) {
      console.error("Failed to load showing: ", error);
      return null;
    }
    const showing = data ? toScheduledShowing(data) : null;
    setResult({ listingId, showing });
    return showing;
  }, [listingId]);

  // Reloads when the screen comes into focus, so a change made on another screen shows up
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Never expose a result that belongs to another listing
  const current = result?.listingId === listingId ? result : null;

  return { showing: current?.showing ?? null, refetch };
}
