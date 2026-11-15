import {
  hasNewNotifications,
  markNotificationsSeen,
} from "@/services/notifications";
import { create } from "zustand";

type NotificationsState = {
  // The dot on the bell
  hasNew: boolean;
  // The mark_notifications_seen() call in progress, so refresh() can wait for it
  pendingMark: Promise<void> | null;
  refresh: () => Promise<void>;
  markSeen: () => Promise<void>;
  reset: () => void;
};

// Shared by the header (shows the dot) and the notifications page (marks it seen).
// A store, because the header lives outside the tab screens and must hear about markSeen()
export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  hasNew: false,
  pendingMark: null,

  refresh: async () => {
    // Leaving the notifications page marks it seen and changes the route at the same time.
    // Wait for the mark first, otherwise the dot could come back from an old answer
    const pending = get().pendingMark;
    if (pending) await pending;

    const { data, error } = await hasNewNotifications();
    if (error) {
      // Keep the current dot. A missing dot is not worth an error message
      console.error("Failed to check for new notifications: ", error);
      return;
    }

    // A markSeen() that started while we waited makes this answer old
    if (get().pendingMark) return;
    set({ hasNew: data });
  },

  markSeen: async () => {
    // Optimistic: the dot goes away at once
    set({ hasNew: false });

    const mark = (async () => {
      const { error } = await markNotificationsSeen();
      if (error) console.error("Failed to mark notifications as seen: ", error);
    })();
    set({ pendingMark: mark });
    await mark;

    // Only clear it if no newer markSeen() has started meanwhile
    if (get().pendingMark === mark) set({ pendingMark: null });
  },

  reset: () => set({ hasNew: false, pendingMark: null }),
}));
