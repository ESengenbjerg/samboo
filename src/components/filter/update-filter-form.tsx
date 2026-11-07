import FilterForm from "@/components/filter/filter-form";
import FormError from "@/components/form-error";
import { Text } from "@/components/ui/text";
import { useProfile } from "@/hooks/useProfile";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useSession } from "@/hooks/useSession";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { updateNotificationFrequency } from "@/services/profiles";
import {
  ClientFilter,
  InformationInterval,
  ScraperFilter,
} from "@/stores/onboarding";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import FormMessage from "../form-message";

export default function UpdateFilterForm() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { scraperFilter, clientFilter, isLoading, error } =
    useSearchParams(userId);
  const {
    profile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useProfile(userId);
  const {
    updateSearchParams,
    isUpdating,
    error: updateError,
    clearError,
  } = useUpdateSearchParams();

  const [successMessage, setSuccessMessage] = useState<null | string>(null);
  const [savedFrequency, setSavedFrequency] =
    useState<InformationInterval | null>(null);
  const [frequencyError, setFrequencyError] = useState<string | null>(null);

  // The tab never unmounts, so clear old messages when the user leaves it
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSuccessMessage(null);
        setFrequencyError(null);
        clearError();
      };
    }, [clearError]),
  );

  // Reads start values once, and must not render until saved search and profile are fetched
  if (!userId || isLoading || isLoadingProfile) {
    return <Text>Laddar bevakning...</Text>;
  }

  if (error) {
    return <FormError>{error}</FormError>;
  }

  if (profileError) {
    return <FormError>{profileError}</FormError>;
  }

  // Interval saved on this visit, otherwise the one from Supabase
  const currentFrequency =
    savedFrequency ?? profile?.notificationFrequency ?? "day";

  async function onSave(
    scraper: ScraperFilter,
    client: ClientFilter,
    interval: InformationInterval,
  ) {
    setSuccessMessage(null);
    setFrequencyError(null);

    if (isUpdating || !userId) return;

    // Only save the interval if the user changed it
    let frequencyOk = true;
    if (interval !== currentFrequency) {
      const { error: saveError } = await updateNotificationFrequency(
        userId,
        interval,
      );

      if (saveError) {
        console.log("Update frequency error:", saveError);
        setFrequencyError(
          "Kunde inte spara hur ofta du vill få mejl. Försök igen.",
        );
        frequencyOk = false;
      } else {
        setSavedFrequency(interval);
      }
    }

    const searchOk = await updateSearchParams(userId, scraper, client);

    if (searchOk && frequencyOk) setSuccessMessage("Bevakning uppdaterad!");
  }

  return (
    <View className="flex-1">
      <FilterForm
        title="Uppdatera bevakning"
        description="Ändra dina sökfilter för att uppdatera bostäderna i ditt resultat."
        submitLabel="Uppdatera bevakning"
        savedScraperFilter={scraperFilter}
        savedClientFilter={clientFilter}
        savedInformationInterval={currentFrequency}
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

      {frequencyError && (
        <View className="px-6 mt-4 self-center">
          <FormError>{frequencyError}</FormError>
        </View>
      )}
    </View>
  );
}
