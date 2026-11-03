import {
  getLikedListingIds,
  likeListing,
  unlikeListing,
} from "@/services/listings";
import { useCallback, useEffect, useState } from "react";

type LikesResult = {
  userId: string;
  ids: Set<number>;
  failed?: boolean;
};

// Which listings the logged in user has liked, and a way to like/unlike them.
// Ids are listings.id. Pass undefined until the session is loaded
export function useLikes(userId: string | undefined) {
  const [result, setResult] = useState<LikesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Ignore the response if the user changed or the component unmounted
    let cancelled = false;

    getLikedListingIds(userId).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Failed to load likes: ", error);
        setResult({ userId, ids: new Set(), failed: true });
        return;
      }
      setResult({ userId, ids: new Set(data.map((row) => row.listing_id)) });
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;
  const likedIds = current?.ids;

  const isLiked = useCallback(
    (listingId: number) => likedIds?.has(listingId) ?? false,
    [likedIds],
  );

  // Optimistic: the heart changes at once and is rolled back if the request fails
  const toggleLike = useCallback(
    async (listingId: number) => {
      if (!userId || !likedIds) return;

      const wasLiked = likedIds.has(listingId);
      const setLiked = (liked: boolean) =>
        setResult((prev) => {
          if (!prev || prev.userId !== userId) return prev;
          const ids = new Set(prev.ids);
          if (liked) ids.add(listingId);
          else ids.delete(listingId);
          return { ...prev, ids };
        });

      setError(null);
      setLiked(!wasLiked);

      const { error } = wasLiked
        ? await unlikeListing(userId, listingId)
        : await likeListing(listingId);

      if (error) {
        console.error("Failed to update like: ", error);
        setLiked(wasLiked);
        setError("Kunde inte uppdatera din lista. Försök igen.");
      }
    },
    [userId, likedIds],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    likedIds: likedIds ?? new Set<number>(),
    isLiked,
    toggleLike,
    isLoading: !!userId && !current,
    error:
      error ??
      (current?.failed ? "Kunde inte hämta dina sparade bostäder." : null),
    clearError,
  };
}
