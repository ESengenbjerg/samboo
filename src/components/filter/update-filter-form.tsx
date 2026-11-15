import FilterForm from "@/components/filter/filter-form";
import FormError from "@/components/form-error";
import { useSession } from "@/hooks/auth/useSession";
import { useSearchParams } from "@/hooks/search/useSearchParams";
import { useUpdateSearchParams } from "@/hooks/search/useUpdateSearchParams";
import { ClientFilter, ScraperFilter } from "@/stores/onboarding";
import { showToast } from "@/stores/toast";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";
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

  // The tab never unmounts, so clear old errors when the user leaves it
  useFocusEffect(
    useCallback(() => {
      return () => {
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
    if (isUpdating || !userId) return;

    const searchOk = await updateSearchParams(userId, scraper, client);

    if (searchOk) showToast("Bevakning uppdaterad.", "success");
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

      {updateError && (
        <View className="px-6 mt-4 self-center">
          <FormError>{updateError}</FormError>
        </View>
      )}
    </View>
  );
}
