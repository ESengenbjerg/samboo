import FilterForm from "@/components/filter/filter-form";
import FormError from "@/components/form-error";
import { useSession } from "@/hooks/auth/useSession";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { ClientFilter, ScraperFilter } from "@/stores/onboarding";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import FormMessage from "../form-message";
import { Spinner } from "../ui/spinner";

export default function UpdateFilterForm() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { scraperFilter, clientFilter, isLoading, error } =
    useSearchParams(userId);
  const {
    updateSearchParams,
    isUpdating,
    error: updateError,
    clearError,
  } = useUpdateSearchParams();

  const [successMessage, setSuccessMessage] = useState<null | string>(null);

  // The tab never unmounts, so clear old messages when the user leaves it
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSuccessMessage(null);
        clearError();
      };
    }, [clearError]),
  );

  // Reads start values once, and must not render until saved search is fetched
  if (!userId || isLoading) {
    return <Spinner size="large" />;
  }

  if (error) {
    return <FormError>{error}</FormError>;
  }

  async function onSave(scraper: ScraperFilter, client: ClientFilter) {
    setSuccessMessage(null);

    if (isUpdating || !userId) return;

    const searchOk = await updateSearchParams(userId, scraper, client);

    if (searchOk) setSuccessMessage("Bevakning uppdaterad!");
  }

  return (
    <View className="flex-1 mb-10">
      <FilterForm
        title="Uppdatera bevakning"
        description="Ändra dina sökfilter för att uppdatera bostäderna i ditt resultat."
        submitLabel="Uppdatera bevakning"
        savedScraperFilter={scraperFilter}
        savedClientFilter={clientFilter}
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
