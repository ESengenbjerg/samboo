import { useOnboardingStore } from "@/stores/onboarding";
import { supabase } from "@/utils/supabase";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { SendInviteDialog } from "../modals/send-invite-dialog";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import { router } from "expo-router";

export default function ConnectAccountForm() {
  // TODO: setError will be used once Supabase implementation is complete
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  async function finish() {
    setError(null);
    setIsLoading(true);

    try {
      // Fetch correct user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not signed in");

      // Fetch user input from previous onboarding steps
      const { profileName, scraperFilter } = useOnboardingStore.getState();

      // If onboarding is not completed, redirect to /profile to start from beginning
      if (!scraperFilter) {
        router.replace("/profile");
        return;
      }

      // Save search, creates row or updates if it already exist
      const { error: filterError } = await supabase
        .from("search_params")
        .upsert(
          {
            user_id: user.id,
            property_types: scraperFilter.propertyTypes,
            areas: [scraperFilter.area],
          },
          { onConflict: "user_id" },
        );
      if (filterError) throw filterError;

      // Save name and update onboarding_completed_at with correct date
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: profileName,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // When everything is saved, onboarding is complete and user is moved to /search
      completeOnboarding();
    } catch (e) {
      console.log("Onboarding error: " + e);
      setError("Något gick fel, försök igen.");
    } finally {
      setIsLoading(false);
    }
  }

  // Send invite to other user
  async function onInvite(email: string) {
    setIsLoading(true);

    // Get user from Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Något gick fel, försök igen.");
      setIsLoading(false);
      return;
    }

    const { error: inviteError } = await supabase
      .from("invites")
      .insert({ from_user_id: user?.id, to_email: email });

    setInvitationDialogOpen(false);

    if (inviteError) {
      console.log("Invite error: " + inviteError);
      setError("Kunde inte skicka inbjudan, försök igen.");
      setIsLoading(false);
      return;
    }

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
