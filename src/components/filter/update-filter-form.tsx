import FilterForm from "@/components/filter/filter-form";
import FormError from "@/components/form-error";
import { Text } from "@/components/ui/text";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useSession } from "@/hooks/useSession";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { ClientFilter, ScraperFilter } from "@/stores/onboarding";
import { useState } from "react";
import { View } from "react-native";
import FormMessage from "../form-message";

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

  const [successMessage, setSuccessMessage] = useState<null | string>(null);

  // Reads start values once, and must not render until saved search is fetched
  if (!userId || isLoading) {
    return <Text>Laddar bevakning...</Text>;
  }

  if (error) {
    return <FormError>{error}</FormError>;
  }

  async function onSave(scraper: ScraperFilter, client: ClientFilter) {
    setSuccessMessage(null);
    if (isUpdating || !userId) return;

    const ok = await updateSearchParams(userId, scraper, client);
    if (ok) setSuccessMessage("Bevakning uppdaterad!");
  }

  return (
    <View className="flex-1">
      <FilterForm
        title="Uppdatera bevakning"
        description="Ändra dina sökfilter för att uppdatera bostäderna i ditt resultat."
        submitLabel="Uppdatera bevakning"
        savedScraperFilter={scraperFilter}
        savedClientFilter={clientFilter}
        savedInformationInterval={"day"}
        onSave={onSave}
        mainColor="primary"
        fieldColor="bg-white"
      />

      {successMessage && (
        <View className="px-6 mt-4 self-center">
          <FormMessage>{successMessage}</FormMessage>
        </View>
      )}

      {updateError && (
        <View className="px-6 mt-4 self-center">
          <FormError>{updateError}</FormError>
        </View>
      )}
    </View>
  );
}
