import { SkippedShowing } from "@/types/showings";
import { create } from "zustand";

type SkippedShowingsState = {
  showings: SkippedShowing[];
  set: (showings: SkippedShowing[]) => void;
  clear: () => void;
};

// Shared between the settings page (where an invite can be accepted), the bell in the
// header (lights up the dot) and the notifications page (shows the notice).
// Local state in useConnectedAccounts would stay on the page where the invite was accepted
export const useSkippedShowingsStore = create<SkippedShowingsState>((set) => ({
  showings: [],
  set: (showings) => set({ showings }),
  clear: () => set({ showings: [] }),
}));
