import { MY_LIST_ID, SHARED_LIST_ID } from "@/constants/saved-lists";
import { useLikedListings } from "@/hooks/likes/useLikedListings";
import { useSharedLikedListings } from "@/hooks/likes/useSharedLikedListings";
import { useNewListingIds } from "@/hooks/listings/useNewListingIds";
import { useMemo } from "react";

// The listings of one saved list: my list, the shared list or a group member's list.
// listId is MY_LIST_ID, SHARED_LIST_ID or the member's user id
export function useSavedList(listId: string, userId: string | undefined) {
  const isShared = listId === SHARED_LIST_ID;
  const likedUserId = listId === MY_LIST_ID ? userId : listId;

  // Both hooks are always called (hooks may not be called conditionally),
  // but only one of them gets an id and fetches anything
  const liked = useLikedListings(isShared ? undefined : likedUserId);
  const shared = useSharedLikedListings(isShared ? userId : undefined);
  const list = isShared ? shared : liked;

  // "Ny" means that I have not opened the listing, in every list. In a group member's
  // list the rows are theirs, so their is_new is replaced with mine (matched on listings.id)
  const { newListingIds } = useNewListingIds(userId);
  const listings = useMemo(
    () => list.listings.map((l) => ({ ...l, is_new: newListingIds.has(l.id) })),
    [list.listings, newListingIds],
  );

  return { ...list, listings };
}
