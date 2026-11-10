import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { PropertyType } from "@/constants/filter-options";
import { Constants, type Enums } from "@shared/database.types";

// TODO: Add persistens for data to survive if app is closed
// @react-native-async-storage/async-storage
// Wrap store in persist(..., { name: "onboarding", storage: createJSONStorage(() => AsyncStorage) }) from zustand/middleware
// Leave onboarding states outside with partialize

export type ScraperFilter = {
  municipalities: string[];
  propertyTypes: PropertyType[];
};

export type ClientFilter = {
  area: string[];
  minRooms?: number;
  maxMonthlyFee?: number;
  minLivingArea?: number;
  showNewConstruction: boolean;
};

// profiles.email_frequency, the database enum public.email_frequency
export type InformationInterval = Enums<"email_frequency">;

// Checks a value from the UI (radio groups give string) against the database's list
export function isInformationInterval(value: string): value is InformationInterval {
  return (Constants.public.Enums.email_frequency as readonly string[]).includes(value);
}

type OnboardingState = {
  profileName: string;
  avatarPath: string | null;
  scraperFilter: ScraperFilter | null;
  clientFilter: ClientFilter | null;
  informationInterval: InformationInterval;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  setProfile: (name: string, avatarPath: string | null) => void;
  setFilters: (
    scraper: ScraperFilter,
    client: ClientFilter,
    interval: InformationInterval,
  ) => void;
  reset: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      profileName: "",
      avatarPath: null,
      scraperFilter: null,
      clientFilter: null,
      informationInterval: "day",
      onboardingComplete: false,
      completeOnboarding: () => set({ onboardingComplete: true }),
      setProfile: (profileName, avatarPath) =>
        set({ profileName, avatarPath }),
      setFilters: (scraperFilter, clientFilter, informationInterval) =>
        set({ scraperFilter, clientFilter, informationInterval }),
      reset: () =>
        set({
          profileName: "",
          avatarPath: null,
          scraperFilter: null,
          clientFilter: null,
          informationInterval: "day",
          onboardingComplete: false,
        }),
    }),
    {
      name: "onboarding",
      storage: createJSONStorage(() => AsyncStorage),
      // Save input choices, onboardingComplete should not survive restart
      partialize: (s) => ({
        profileName: s.profileName,
        avatarPath: s.avatarPath,
        scraperFilter: s.scraperFilter,
        clientFilter: s.clientFilter,
        informationInterval: s.informationInterval,
      }),
    },
  ),
);
