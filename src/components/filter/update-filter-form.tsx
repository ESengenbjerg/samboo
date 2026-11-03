import FilterForm from "@/components/filter/filter-form";
import FormError from "@/components/form-error";
import { Text } from "@/components/ui/text";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useSession } from "@/hooks/useSession";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { ClientFilter, ScraperFilter } from "@/stores/onboarding";
import { router } from "expo-router";
import { View } from "react-native";

export default function UpdateFilterForm() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { scraperFilter, clientFilter, isLoading, error } =
    useSearchParams(userId);
  const {
    updateSearchParams,
    isUpdating,
    error: updateError,
  } = useUpdateSearchParams();

  // Reads start values once, and must not render until saved search is fetched
  if (!userId || isLoading) {
    return <Text>Laddar bevakning...</Text>;
  }

  if (error) {
    return <FormError>{error}</FormError>;
  }

  async function onSave(scraper: ScraperFilter, client: ClientFilter) {
    if (isUpdating || !userId) return;

    const ok = await updateSearchParams(userId, scraper, client);
    if (ok) router.back();
  }

  return (
    <View>
      <FilterForm
        title="Uppdatera bevakning"
        description="Ändra dina sökfilter för att uppdatera bostäderna i ditt resultat."
        submitLabel="Uppdatera bevakning"
        savedScraperFilter={scraperFilter}
        savedClientFilter={clientFilter}
        savedInformationInterval={"day"}
        onSave={onSave}
        fieldColor="bg-white"
      />

      {updateError && (
        <View>
          <FormError>{updateError}</FormError>
        </View>
      )}
    </View>
  );
}
