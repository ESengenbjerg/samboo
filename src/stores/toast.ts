import { create } from "zustand";

type ToastVariant = "info" | "success" | "error";

type ToastState = {
  message: string | null;
  variant: ToastVariant;
  // Bumps on every show(), so showing the same message twice restarts the timer
  id: number;
  show: (message: string, variant?: ToastVariant) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: "error",
  id: 0,
  show: (message, variant = "error") =>
    set((s) => ({ message, variant, id: s.id + 1 })),
  hide: () => set({ message: null }),
}));

// Usable outside React components (e.g. in other stores)
export const showToast = (message: string, variant?: ToastVariant) =>
  useToastStore.getState().show(message, variant);
