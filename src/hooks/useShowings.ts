import { getPastShowings, getUpcomingShowings } from "@/services/showings";
import { ScheduledShowings, ShowingRow } from "@/types/showings";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type ShowingsResult = {
  key: string;
  showings: ScheduledShowings[];
  failed?: boolean;
};

// showing_date ("2026-10-29") and start_time ("11:00:00" or null) are local time.
// The Date is built from numbers, since parsing a string without time zone differs between engines
function toScheduledShowing(row: ShowingRow): ScheduledShowings {
  const [year, month, day] = row.showing_date.split("-").map(Number);
  const [hour, minute] = (row.start_time ?? "00:00").split(":").map(Number);

  return {
    id: row.id,
    address: row.listings.ld_json.streetAddress ?? "Adress saknas",
    municipality: row.listings.municipality ?? "",
    area: row.listings.area ?? "",
    startsAt: new Date(year, month - 1, day, hour, minute),
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

  // Reloads every time the screen comes into focus, so a showing saved on
  // another screen shows up when the user comes back to this one
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;
      const resultKey = `${userId}:${when}`;
      const load = when === "past" ? getPastShowings : getUpcomingShowings;

      load().then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load showings: ", error);
          setResult({ key: resultKey, showings: [], failed: true });
          return;
        }
        setResult({ key: resultKey, showings: (data ?? []).map(toScheduledShowing) });
      });

      return () => {
        cancelled = true;
      };
    }, [userId, when]),
  );

  // Never expose a result that belongs to a previous user
  const current = userId && result?.key === key ? result : null;

  return {
    showings: current?.showings ?? [],
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta visningar." : null,
  };
}
