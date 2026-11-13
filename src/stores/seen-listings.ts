import { create } from "zustand";

type SeenListingsState = {
  seenIds: Set<number>;
  markSeen: (listingId: number) => void;
  reset: () => void;
};

// Listings (listings.id) I have opened in this session. Lets the "Ny" tag disappear at once,
// without waiting for the lists to refetch. The database stays the source of truth
export const useSeenListingsStore = create<SeenListingsState>((set) => ({
  seenIds: new Set(),

  markSeen: (listingId) =>
    set((state) => {
      if (state.seenIds.has(listingId)) return state;
      const seenIds = new Set(state.seenIds);
      seenIds.add(listingId);
      return { seenIds };
    }),

  reset: () => set({ seenIds: new Set() }),
}));
