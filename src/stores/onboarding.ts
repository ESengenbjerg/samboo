import { create } from "zustand";

// TODO: Add persistens for data to survive if app is closed
// @react-native-async-storage/async-storage
// Wrap store in persist(..., { name: "onboarding", storage: createJSONStorage(() => AsyncStorage) }) from zustand/middleware

type OnboardingState = {
  profileName: string;
  profileImage: string;
  // TODO: Swap to correct type when filter type is set
  savedSearch: Record<string, unknown> | null;
  setProfile: (name: string, image: string) => void;
  setSavedSearch: (savedSearch: Record<string, unknown>) => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  profileName: "",
  profileImage: "",
  savedSearch: null,
  setProfile: (profileName, profileImage) => set({ profileName, profileImage }),
  setSavedSearch: (savedSearch) => set({ savedSearch }),
  reset: () => set({ profileName: "", profileImage: "", savedSearch: null }),
}));
