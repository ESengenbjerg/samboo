import { getPastShowings, getUpcomingShowings } from "@/services/showings";
import { ScheduledShowing, ShowingRow } from "@/types/showings";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type ShowingsResult = {
  key: string;
  showings: ScheduledShowing[];
  failed?: boolean;
};

// showing_date ("2026-10-29") and start_time ("11:00:00" or null) are local time.
// The Date is built from numbers, since parsing a string without time zone differs between engines
export function toScheduledShowing(row: ShowingRow): ScheduledShowing {
  const [year, month, day] = row.showing_date.split("-").map(Number);
  const [hour, minute] = (row.start_time ?? "00:00").split(":").map(Number);

  return {
    id: row.id,
    listingId: row.listing_id,
    address: row.listings.address ?? "Adress saknas",
    municipality: row.listings.municipality ?? "",
    area: row.listings.area ?? "",
    startsAt: new Date(year, month - 1, day, hour, minute),
    note: row.note,
  };
}

// My group's showings, upcoming (default) or past. Empty if I am not in a group.
// Pass undefined until the session is loaded
export function useShowings(
  userId: string | undefined,
  when: "upcoming" | "past" = "upcoming",
) {
  const [result, setResult] = useState<ShowingsResult | null>(null);
  const key = `${userId}:${when}`;

  // Loads the showings from the server. Returns a cleanup function that
  // makes us ignore the response if the user changed or the screen lost focus
  const fetchShowings = useCallback(() => {
    if (!userId) return;

    let cancelled = false;
    const resultKey = `${userId}:${when}`;
    const load = when === "past" ? getPastShowings : getUpcomingShowings;

    load().then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Failed to load showings: ", error);
        // Keep the previous rows so a failed fetch doesn't look like an empty list
        setResult((prev) => ({
          key: resultKey,
          showings: prev?.key === resultKey ? prev.showings : [],
          failed: true,
        }));
        return;
      }
      setResult({
        key: resultKey,
        showings: (data ?? []).map(toScheduledShowing),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [userId, when]);

  // Reloads every time the screen comes into focus, so a showing saved on
  // another screen shows up when the user comes back to this one
  useFocusEffect(fetchShowings);

  // Removes a showing from a list without fetching again.
  // Used after a delete that the server has already confirmed.
  const removeShowing = useCallback((id: number) => {
    setResult((prev) =>
      prev
        ? { ...prev, showings: prev.showings.filter((s) => s.id !== id) }
        : prev,
    );
  }, []);

  // Never expose a result that belongs to a previous user
  const current = userId && result?.key === key ? result : null;

  return {
    showings: current?.showings ?? [],
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta visningar." : null,
    removeShowing,
    refetch: fetchShowings,
  };
}
