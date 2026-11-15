import { useNotificationsStore } from "@/stores/notifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

// Marks the notifications as seen when the user leaves the notifications page.
// On leave, not on open: the page has already loaded the notifications, so it can
// still show what was new during the visit.
// ready: the page has loaded this visit's data. If the user leaves before that, nothing
// is marked: they have not seen the new notifications yet, so the dot must stay
export function useMarkNotificationsSeen(ready: boolean) {
  const markSeen = useNotificationsStore((s) => s.markSeen);

  // A ref, so the cleanup below reads the value at the time of leaving
  const readyRef = useRef(ready);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useFocusEffect(
    useCallback(() => {
      // The cleanup runs when the page loses focus (another tab or screen) or unmounts
      return () => {
        if (readyRef.current) markSeen();
      };
    }, [markSeen]),
  );
}
