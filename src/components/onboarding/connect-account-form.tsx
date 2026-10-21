import { useOnboardingStore } from "@/stores/onboarding";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { SendInviteDialog } from "../modals/send-invite-dialog";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function ConnectAccountForm() {
  // TODO: setError will be used once Supabase implementation is complete
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  async function finish() {
    // TODO: Send profile + filter from store to Supabase and set profiles.onboarding_completed_at
    completeOnboarding();
  }

  async function onInvite() {
    setIsLoading(true);
    // TODO: Send invite to account

    setInvitationDialogOpen(false);
    setIsLoading(false);
    await finish();
  }

  async function onSkip() {
    await finish();
  }

  return (
    <View className="flex-1 justify-center w-full px-8 gap-6">
      <View className="gap-2">
        <Text variant="h1">Koppla konto</Text>
        <Text>
          Koppla ihop ditt konto med ett eller flera andra för att kunna se
          varandras sparade objekt och gemensamma visningstider
        </Text>
      </View>

      {invitationDialogOpen && (
        <SendInviteDialog
          open={invitationDialogOpen}
          onOpenChange={setInvitationDialogOpen}
          onAction={onInvite}
        />
      )}

      {error && <FormError>{error}</FormError>}

      <View className="gap-2 items-start">
        <Button
          variant="secondary"
          onPress={() => setInvitationDialogOpen(true)}
          disabled={isLoading}
          className="px-10"
        >
          <Text>{!isLoading ? "Bjud in konto" : "Bjuder in..."}</Text>
        </Button>
        <Text>Detta kan göras senare via dina kontoinställningar</Text>
        <Button variant="link" className="p-0" onPress={onSkip}>
          <Text>Hoppa över</Text>
        </Button>
      </View>
    </View>
  );
}
