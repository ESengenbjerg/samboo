import { create } from "zustand";

// TODO: Add persistens for data to survive if app is closed
// @react-native-async-storage/async-storage
// Wrap store in persist(..., { name: "onboarding", storage: createJSONStorage(() => AsyncStorage) }) from zustand/middleware

export type ScraperFilter = {
  area: string;
  propertyTypes: string[];
};

export type ClientFilter = {
  minRooms?: number;
  maxMonthlyFee?: number;
  minLivingArea?: number;
  showNewProduction: boolean;
};

export type InformationInterval = "day" | "week";

type OnboardingState = {
  profileName: string;
  profileImage: string;
  scraperFilter: ScraperFilter | null;
  clientFilter: ClientFilter | null;
  informationInterval: InformationInterval;
  setProfile: (name: string, image: string) => void;
  setFilters: (scraper: ScraperFilter, client: ClientFilter, interval: InformationInterval) => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  profileName: "",
  profileImage: "",
  scraperFilter: null,
  clientFilter: null,
  informationInterval: "day",
  setProfile: (profileName, profileImage) => set({ profileName, profileImage }),
  setFilters: (scraperFilter, clientFilter, informationInterval) => set({ scraperFilter, clientFilter, informationInterval }),
  reset: () => set({ profileName: "", profileImage: "", scraperFilter: null, clientFilter: null, informationInterval: "day" }),
}));
