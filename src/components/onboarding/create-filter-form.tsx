import FilterForm from "@/components/filter/filter-form";
import { useOnboardingHydrated } from "@/hooks/profile/useOnboardingHydrated";
import {
  ClientFilter,
  InformationInterval,
  ScraperFilter,
  useOnboardingStore,
} from "@/stores/onboarding";
import { router } from "expo-router";
import { useState } from "react";
import InformationIntervalPicker from "../filter/information-interval-picker";

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

  const [informationInterval, setInformationInterval] =
    useState<InformationInterval>(savedInformationInterval);

  function onSave(scraperFilter: ScraperFilter, clientFilter: ClientFilter) {
    setFilters(scraperFilter, clientFilter, informationInterval);
    router.push({ pathname: "/connect" });
  }

  return (
    <FilterForm
      title="Skapa bevakning"
      description="Du kan ändra din bevakning senare under fliken Bevakning."
      submitLabel="Skapa bevakning"
      savedScraperFilter={savedScraperFilter}
      savedClientFilter={savedClientFilter}
      onSave={onSave}
      intervalField={
        <InformationIntervalPicker
          value={informationInterval}
          onChange={setInformationInterval}
        />
      }
    />
  );
}
