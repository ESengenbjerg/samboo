import { useSession } from "@/hooks/auth/useSession";
import { useAnsweredInviteStore } from "@/stores/answered-invite";
import { useNotificationsStore } from "@/stores/notifications";
import { useSkippedShowingsStore } from "@/stores/skipped-showings";
import { usePathname } from "expo-router";
import { useEffect } from "react";

const NOTIFICATIONS_PATH = "/notifications";

// Whether to show the dot on the bell in the header. The header stays mounted between the
// tabs, so it checks again every time the route changes instead of on focus.
// Never shown on the notifications page itself
export function useNotificationDot() {
  const { session } = useSession();
  const userId = session?.user.id;
  const pathname = usePathname();
  const isOnNotificationsPage = pathname === NOTIFICATIONS_PATH;

  const hasNew = useNotificationsStore((s) => s.hasNew);
  const refresh = useNotificationsStore((s) => s.refresh);
  const reset = useNotificationsStore((s) => s.reset);
  // Lost showings after accepting an invite are not in the database, so the dot
  // cannot know about them. Lit until the notifications page has shown them.
  // The confirmation of an answer does not light it: the user just did that themselves
  const hasSkipped = useSkippedShowingsStore((s) => s.showings.length > 0);
  const clearAnswer = useAnsweredInviteStore((s) => s.clear);
  const clearSkipped = useSkippedShowingsStore((s) => s.clear);

  useEffect(() => {
    // Logged out: never keep the previous user's dot
    if (!userId) {
      reset();
      clearAnswer();
      clearSkipped();
      return;
    }
    if (!isOnNotificationsPage) refresh();
  }, [
    userId,
    pathname,
    isOnNotificationsPage,
    refresh,
    reset,
    clearAnswer,
    clearSkipped,
  ]);

  return {
    showDot: (hasNew || hasSkipped) && !isOnNotificationsPage,
  };
}
