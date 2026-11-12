import { Text } from "@/components/ui/text";
import { useSession } from "@/hooks/auth/useSession";
import { useProfile } from "@/hooks/useProfile";
import { updateNotificationFrequency } from "@/services/profiles";
import { InformationInterval } from "@/stores/onboarding";
import { showToast } from "@/stores/toast";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { Spinner } from "../ui/spinner";
import InformationIntervalSettings from "./information-interval-settings";

export default function EmailFrequencySettings() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { profile, isLoading, error } = useProfile(userId);

  // Choice made on this visit, otherwise the value from Supabase
  const [selected, setSelected] = useState<InformationInterval | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!userId || isLoading) return <Spinner size="large" />;
  if (error) return <FormError>{error}</FormError>;

  const current = selected ?? profile?.notificationFrequency ?? "day";

  async function onChange(interval: InformationInterval) {
    if (!userId || interval === current) return;

    const previous = current;
    setSaveError(null);
    setSelected(interval);

    const { error: updateError } = await updateNotificationFrequency(
      userId,
      interval,
    );

    if (updateError) {
      console.log("Update frequency error: ", updateError);
      setSelected(previous);
      setSaveError("Kunde inte spara hur ofta du vill få mail. Försök igen.");
      return;
    }

    showToast("Mailfrekvens uppdaterad!", "success");
  }

  return (
    <View>
      <Text variant="h2">Mejl</Text>
      <InformationIntervalSettings value={current} onChange={onChange} />
      {saveError && <FormError>{saveError}</FormError>}
    </View>
  );
}