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

export class NotSignedInError extends Error {
  constructor() {
    super("Not signed in");
  }
}

// Message for a failed saveOnboarding(). P0001 = raise exception in the database,
// the message is already in Swedish (e.g. too many changes to the search)
export function onboardingErrorMessage(error: unknown) {
  if (error instanceof NotSignedInError) {
    return "Din session har gått ut. Logga in igen.";
  }
  const code = (error as { code?: string } | null)?.code;
  if (code === "rate_limited") {
    return "Du har gjort för många ändringar. Vänta en stund och försök igen.";
  }
  if (code === "P0001") return (error as { message: string }).message;
  return "Kunde inte spara din profil och bevakning. Kontrollera din uppkoppling och försök igen.";
}
