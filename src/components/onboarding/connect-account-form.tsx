import { useCompleteOnboarding } from "@/hooks/use-complete-onboarding";
import { useSendInvite } from "@/hooks/use-send-invite";
import { useOnboardingStore } from "@/stores/onboarding";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { SendInviteDialog } from "../modals/send-invite-dialog";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function ConnectAccountForm() {
  const [error, setError] = useState<string | null>(null);
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const completeOnboardingMutation = useCompleteOnboarding();
  const inviteMutation = useSendInvite();
  const isLoading =
    completeOnboardingMutation.isPending || inviteMutation.isPending;

  async function finish() {
    setError(null);

    // Fetch user input from previous onboarding steps
    const { profileName, scraperFilter } = useOnboardingStore.getState();

    // If onboarding is not completed, redirect to /profile to start from beginning
    if (!scraperFilter) {
      router.replace("/profile");
      return;
    }

    try {
      // Save search and name, and mark onboarding as completed
      await completeOnboardingMutation.mutateAsync({
        profileName,
        scraperFilter,
      });

      // When everything is saved, onboarding is complete and user is moved to /search
      completeOnboarding();
    } catch (e) {
      console.log("Onboarding error: " + e);
      setError("Något gick fel, försök igen.");
    }
  }

  // Send invite to other user
  async function onInvite(email: string) {
    setError(null);

    try {
      await inviteMutation.mutateAsync(email);
    } catch (e) {
      console.log("Invite error: " + e);
      setInvitationDialogOpen(false);
      setError("Kunde inte skicka inbjudan, försök igen.");
      return;
    }

    setInvitationDialogOpen(false);
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
          <Text>Bjud in konto</Text>
        </Button>
        <Text>Detta kan göras senare via dina kontoinställningar</Text>
        <Button
          variant="link"
          className="p-0"
          onPress={onSkip}
          disabled={isLoading}
        >
          <Text>Hoppa över</Text>
        </Button>
      </View>
    </View>
  );
}
