import { Text } from "@/components/ui/text";
import { useSession } from "@/hooks/auth/useSession";
import { useProfile } from "@/hooks/useProfile";
import { updateNotificationFrequency } from "@/services/profiles";
import { InformationInterval } from "@/stores/onboarding";
import { showToast } from "@/stores/toast";
import { useState } from "react";
import { View } from "react-native";
import InformationIntervalPicker from "../filter/information-interval-picker";
import FormError from "../form-error";
import { Spinner } from "../ui/spinner";

export default function EmailFrequencySettings() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { profile, isLoading, error } = useProfile(userId);

  // Choice made on this visit, otherwise the value from Supabase
  const [selected, setSelected] = useState<InformationInterval | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const current = selected ?? profile?.notificationFrequency ?? "day";

  async function onChange(interval: InformationInterval) {
    // Ignore clicks while a save is running, so a failed save
    // cannot overwrite a newer choice
    if (!userId || isSaving || interval === current) return;

    const previous = current;
    setSaveError(null);
    setSelected(interval);
    setIsSaving(true);

    const { error: updateError } = await updateNotificationFrequency(
      userId,
      interval,
    );

    setIsSaving(false);

    if (updateError) {
      console.log("Update frequency error:", updateError);
      setSelected(previous);
      setSaveError("Kunde inte spara hur ofta du vill få mejl. Försök igen.");
      return;
    }

    showToast("Mejlfrekvens uppdaterad!", "success");
  }

  return (
    <View className="gap-4">
      <Text variant="h2">Mejl</Text>
      {!userId || isLoading ? (
        <Spinner size="large" />
      ) : error ? (
        <FormError>{error}</FormError>
      ) : (
        <InformationIntervalPicker value={current} onChange={onChange} />
      )}
      {saveError && <FormError>{saveError}</FormError>}
    </View>
  );
}
