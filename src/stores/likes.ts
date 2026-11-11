import {
  getLikedListingIds,
  likeListing,
  unlikeListing,
} from "@/services/listings";
import { showToast } from "@/stores/toast";
import { create } from "zustand";

type LikesState = {
  userId: string | null;
  likedIds: Set<number>;
  load: (userId: string) => Promise<void>;
  reset: () => void;
  toggleLike: (listingId: number) => Promise<void>;
};

// Listings with a save/unsave request in flight. Taps on these are ignored,
// so a double tap can never send like + unlike at the same time.
const inFlight = new Set<number>();

export const useLikesStore = create<LikesState>((set, get) => ({
  userId: null,
  likedIds: new Set(),

  load: async (userId) => {
    set({ userId, likedIds: new Set() });

    const { data, error } = await getLikedListingIds(userId);

    // Ignore response if user changed while we waited
    if (get().userId !== userId) return;

    if (error) {
      console.error("Failed to load likes: ", error);
      return;
    }
    set({ likedIds: new Set(data.map((row) => row.listing_id)) });
  },

  reset: () => {
    inFlight.clear();
    set({ userId: null, likedIds: new Set() });
  },

  // Optimistic: the heart changes at once and is rolled back if the request fails
  toggleLike: async (listingId) => {
    const { userId } = get();
    if (!userId) return;

    // A request for this listing is already running – ignore the tap
    if (inFlight.has(listingId)) return;
    inFlight.add(listingId);

    const wasLiked = get().likedIds.has(listingId);
    const setLiked = (liked: boolean) =>
      set((state) => {
        const likedIds = new Set(state.likedIds);
        if (liked) likedIds.add(listingId);
        else likedIds.delete(listingId);
        return { likedIds };
      });

    setLiked(!wasLiked);

    try {
      const { error } = wasLiked
        ? await unlikeListing(userId, listingId)
        : await likeListing(listingId);

      if (error) {
        console.error("Failed to update like: ", error);
        setLiked(wasLiked); // revert the heart
        showToast("Kunde inte spara, försök igen");
      }
    } catch (e) {
      console.error("Failed to update like: ", e);
      setLiked(wasLiked);
      showToast("Kunde inte spara, försök igen");
    } finally {
      inFlight.delete(listingId);
    }
  },
}));
