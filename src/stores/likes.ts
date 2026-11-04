import {
    getLikedListingIds,
    likeListing,
    unlikeListing,
} from "@/services/listings";
import { create } from "zustand";

type LikesState = {
  userId: string | null;
  likedIds: Set<number>;
  error: string | null;
  load: (userId: string) => Promise<void>;
  reset: () => void;
  toggleLike: (listingId: number) => Promise<void>;
  clearError: () => void;
};

export const useLikesStore = create<LikesState>((set, get) => ({
  userId: null,
  likedIds: new Set(),
  error: null,

  load: async (userId) => {
    set({ userId, likedIds: new Set(), error: null });

    const { data, error } = await getLikedListingIds(userId);

    // Ignore response if user changed while we waited
    if (get().userId !== userId) return;

    if (error) {
      console.error("Failed to load likes: ", error);
      set({ error: "Kunde inte hämta dina sparade bostäder." });
      return;
    }
    set({ likedIds: new Set(data.map((row) => row.listing_id)) });
  },

  reset: () => set({ userId: null, likedIds: new Set(), error: null }),

  // Optimistic: the heart changes at once and is rolled back if the request fails
  toggleLike: async (listingId) => {
    const { userId } = get();
    if (!userId) return;

    const wasLiked = get().likedIds.has(listingId);
    const setLiked = (liked: boolean) =>
      set((state) => {
        const likedIds = new Set(state.likedIds);
        if (liked) likedIds.add(listingId);
        else likedIds.delete(listingId);
        return { likedIds };
      });

    set({ error: null });
    setLiked(!wasLiked);

    const { error } = wasLiked
      ? await unlikeListing(userId, listingId)
      : await likeListing(listingId);

    if (error) {
      console.error("Failed to update like: ", error);
      setLiked(wasLiked);
      set({ error: "Kunde inte uppdatera din lista. Försök igen." });
    }
  },

  clearError: () => set({ error: null }),
}));
