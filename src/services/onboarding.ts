import { completeProfile } from "@/services/profiles";
import { saveSearchParams } from "@/services/search-params";
import {
  ClientFilter,
  InformationInterval,
  ScraperFilter,
} from "@/stores/onboarding";

// Saves everything from the onboarding steps. Throws if any step fails
export async function saveOnboarding(
  userId: string,
  profileName: string,
  scraperFilter: ScraperFilter,
  clientFilter: ClientFilter,
  informationInterval: InformationInterval,
) {
  // Save the search first. completeProfile() marks onboarding as done,
  // so it must run last, when everything else is saved
  const { error: filterError } = await saveSearchParams(
    userId,
    scraperFilter,
    clientFilter,
  );
  if (filterError) throw filterError;

  const { error: profileError } = await completeProfile(
    userId,
    profileName,
    informationInterval,
  );
  if (profileError) throw profileError;
}
