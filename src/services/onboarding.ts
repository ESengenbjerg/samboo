import { completeProfile } from "@/services/profiles";
import { saveSearchParams } from "@/services/search-params";
import { ClientFilter, ScraperFilter } from "@/stores/onboarding";

// Saves everything from the onboarding steps. Throws if any step fails
export async function saveOnboarding(
  userId: string,
  profileName: string,
  scraperFilter: ScraperFilter,
  clientFilter: ClientFilter,
) {
  const { error: profileError } = await completeProfile(userId, profileName);
  if (profileError) throw profileError;

  const { error: filterError } = await saveSearchParams(
    userId,
    scraperFilter,
    clientFilter,
  );
  if (filterError) throw filterError;
}
