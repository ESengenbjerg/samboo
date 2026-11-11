import { getShowingEvents } from "@/services/notifications";
import { ShowingEvent, ShowingEventsByDay } from "@/types/notifications";
import { toNotificationDay } from "@/utils/notification-day";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

type ShowingEventsResult = {
  userId: string;
  events: ShowingEvent[];
  failed?: boolean;
};

// Changes to my group's showings made by the other members, split into today / yesterday /
// earlier by when the change was made. Newest first within each day. Empty without a group.
// Pass undefined until the session is loaded. Refetches every time the page is opened
export function useShowingEvents(userId: string | undefined) {
  const [result, setResult] = useState<ShowingEventsResult | null>(null);
  // true while the fetch of this visit is running. result still holds the previous visit's
  // data meanwhile, so isLoading alone can not tell if the data is up to date
  const [isFetching, setIsFetching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      setIsFetching(true);
      getShowingEvents().then(({ data, error }) => {
        if (cancelled) return;
        setIsFetching(false);
        if (error) {
          console.error("Failed to load showing events: ", error);
          setResult({ userId, events: [], failed: true });
          return;
        }
        setResult({ userId, events: data });
      });

      return () => {
        cancelled = true;
      };
    }, [userId]),
  );

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;
  const events = current?.events;

  // The database returns them newest first, so each day keeps that order
  const eventsByDay = useMemo(() => {
    const byDay: ShowingEventsByDay = { today: [], yesterday: [], earlier: [] };
    for (const event of events ?? []) {
      byDay[toNotificationDay(event.created_at)].push(event);
    }
    return byDay;
  }, [events]);

  return {
    eventsByDay,
    isLoading: !!userId && !current,
    // true when this visit's fetch has finished successfully
    isReady: !!current && !current.failed && !isFetching,
    error: current?.failed ? "Kunde inte hämta ändringar i visningar." : null,
  };
}
