import { useGroupLikedListings } from "@/hooks/useGroupLikedListings";
import { MemberUpdate, MemberUpdatesByDay } from "@/types/notifications";
import { toNotificationDay } from "@/utils/notification-day";
import { useMemo } from "react";

// The latest of two timestamps, where null counts as older than any time
function latest(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

// Group notifications: for every member of my group, how many of their liked listings
// I have not opened yet, split into today / yesterday / earlier by when they were liked.
// newListingIds comes from useNewListingIds(), so the notifications page fetches it once
// and can use it for the feed notification too.
// Members with nothing new are left out. Empty if I am not in a group
export function useGroupUpdates(
  userId: string | undefined,
  newListingIds: Set<number>,
) {
  const { lists, isLoading, error } = useGroupLikedListings(userId);

  const updatesByDay = useMemo(() => {
    const byDay: MemberUpdatesByDay = { today: [], yesterday: [], earlier: [] };

    const updates: MemberUpdate[] = lists
      .map(({ member, listings }) => {
        // Match on listings.id against MY new listings. The member's own is_new is theirs
        // (and always false on a liked listing), so it can not be used here
        const newOnes = listings.filter((l) => newListingIds.has(l.id));
        return {
          member,
          newCount: newOnes.length,
          latestLikedAt: newOnes.reduce<string | null>(
            (acc, l) => latest(acc, l.liked_at),
            null,
          ),
        };
      })
      .filter((u) => u.newCount > 0);

    // Newest first within each day. Without a liked_at last
    updates.sort((a, b) => {
      if (a.latestLikedAt === b.latestLikedAt) return 0;
      return latest(a.latestLikedAt, b.latestLikedAt) === a.latestLikedAt
        ? -1
        : 1;
    });

    for (const update of updates) {
      byDay[toNotificationDay(update.latestLikedAt)].push(update);
    }
    return byDay;
  }, [lists, newListingIds]);

  return { updatesByDay, isLoading, error };
}
