import { useNotificationsStore } from "@/stores/notifications";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

// Marks the notifications as seen when the user leaves the notifications page.
// On leave, not on open: the page has already loaded is_unseen for the showing events,
// so it can still highlight what was new during the visit
export function useMarkNotificationsSeen() {
  const markSeen = useNotificationsStore((s) => s.markSeen);

  useFocusEffect(
    useCallback(() => {
      // The cleanup runs when the page loses focus (another tab or screen) or unmounts
      return () => {
        markSeen();
      };
    }, [markSeen]),
  );
}
