import { completeProfile } from "@/services/profiles";
import { saveSearchParams } from "@/services/search-params";
import { ScraperFilter } from "@/stores/onboarding";

// Saves everything from the onboarding steps. Throws if any step fails
export async function saveOnboarding(
  userId: string,
  profileName: string,
  scraperFilter: ScraperFilter,
) {
  const { error: filterError } = await saveSearchParams(userId, scraperFilter);
  if (filterError) throw filterError;

  const { error: profileError } = await completeProfile(userId, profileName);
  if (profileError) throw profileError;
}
