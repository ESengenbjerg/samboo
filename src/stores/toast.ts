import { create } from "zustand";

type ToastState = {
  message: string | null;
  // Bumps on every show(), so showing the same message twice restarts the timer
  id: number;
  show: (message: string) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  id: 0,
  show: (message) => set((s) => ({ message, id: s.id + 1 })),
  hide: () => set({ message: null }),
}));

// Usable outside React components (e.g. in other stores)
export const showToast = (message: string) =>
  useToastStore.getState().show(message);
