import { completeOnboardingProfile } from "@/services/profile";
import { saveSearchParams } from "@/services/search-params";
import { ScraperFilter } from "@/stores/onboarding";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Saves search and profile, in that order, and refreshes cached profile
export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      profileName,
      scraperFilter,
    }: {
      profileName: string;
      scraperFilter: ScraperFilter;
    }) => {
      await saveSearchParams(scraperFilter);
      await completeOnboardingProfile(profileName);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
};
