import FilterForm from "@/components/filter/filter-form";
import { useOnboardingHydrated } from "@/hooks/useOnboardingHydrated";
import {
  ClientFilter,
  InformationInterval,
  ScraperFilter,
  useOnboardingStore,
} from "@/stores/onboarding";
import { router } from "expo-router";

export default function CreateFilterForm() {
  // Wait until the store is hydrated, otherwise the saved values
  // are still null/default and the form would start with empty values
  const hasHydrated = useOnboardingHydrated();
  if (!hasHydrated) return null;

  return <CreateFilterFields />;
}

function CreateFilterFields() {
  const setFilters = useOnboardingStore((s) => s.setFilters);

  // Fetches made choices in case user has started onboarding and then leaves app, after making filter choices
  const savedScraperFilter = useOnboardingStore((s) => s.scraperFilter);
  const savedClientFilter = useOnboardingStore((s) => s.clientFilter);
  const savedInformationInterval = useOnboardingStore(
    (s) => s.informationInterval,
  );

  function onSave(
    scraperFilter: ScraperFilter,
    clientFilter: ClientFilter,
    informationInterval: InformationInterval,
  ) {
    setFilters(scraperFilter, clientFilter, informationInterval);
    router.push({ pathname: "/connect" });
  }

  return (
    <FilterForm
      title="Skapa bevakning"
      description="Du kan ändra din bevakning senare via Uppdatera bevakning på sök-sidan."
      submitLabel="Skapa bevakning"
      savedScraperFilter={savedScraperFilter}
      savedClientFilter={savedClientFilter}
      savedInformationInterval={savedInformationInterval}
      onSave={onSave}
    />
  );
}
