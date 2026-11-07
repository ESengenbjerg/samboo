import { getCurrentUser } from "@/services/auth";
import {
  createInvite,
  inviteErrorMessage,
  validateInviteEmails,
} from "@/services/invites";
import { saveOnboarding } from "@/services/onboarding";
import { useOnboardingStore } from "@/stores/onboarding";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import FormMessage from "../form-message";
import { SendInviteDialog } from "../modals/send-invite-dialog";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function ConnectAccountForm() {
  // TODO: setError will be used once Supabase implementation is complete
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  async function finish() {
    setError(null);
    setIsLoading(true);

    try {
      // Fetch correct user
      const user = await getCurrentUser();
      if (!user) throw new Error("Not signed in");

      // Fetch user input from previous onboarding steps
      // The profile image is already uploaded in the profile step

      const { profileName, scraperFilter, clientFilter, informationInterval } =
        useOnboardingStore.getState();

      // If a step is missing, redirect to /profile to start from beginning
      // The profile image is optional, so avatarPath is not checked
      if (!profileName || !scraperFilter || !clientFilter) {
        router.replace("/profile");
        return false;
      }

      await saveOnboarding(
        user.id,
        profileName,
        scraperFilter,
        clientFilter,
        informationInterval,
      );

      // Everything is sabed. Tge caller decides when the user is moved to /search
      return true;
    } catch (e) {
      console.log("Onboarding error: ", e);
      setError("Något gick fel, försök igen.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  // Save onboarding, then send invites to other users
  async function onInvite(emails: string[]) {
    // Check all before saving or sending anything
    const validationError = validateInviteEmails(emails);

    if (validationError) {
      setError(validationError);
      return emails;
    }

    const finished = await finish();
    if (!finished) return emails;

    setIsLoading(true);

    // Declared outside try, so catch knows which were not tried yet
    const failed: string[] = [];
    let tried = 0;
    let lastError: string | null = null;

    try {
      // Get user from Supabase
      const user = await getCurrentUser();
      if (!user) throw new Error("Not signed in.");

      // Keep going on errors, so one rejected address does not stop the rest
      for (const email of emails) {
        const { error: inviteError } = await createInvite(user.id, email);
        tried++;

        if (inviteError) {
          console.log("Invite error:", inviteError);
          failed.push(email);
          lastError = inviteErrorMessage(inviteError);
        }
      }
    } catch (e) {
      console.log("Invite error", e);
      // The ones not tried yet were not sent either
      failed.push(...emails.slice(tried));
      lastError = "Något gick fel, försök igen.";
    } finally {
      setIsLoading(false);
    }

    if (lastError) {
      setError(lastError);
      return failed;
    }

    // All invites sent: close dialog and show success view
    setInvitationDialogOpen(false);
    setInviteSent(true);
    return [];
  }

  async function onSkip() {
    const finished = await finish();
    if (finished) completeOnboarding();
  }

  // Shown after invites are sent. The user decides when to continue
  if (inviteSent) {
    return (
      <View className="flex-1 justify-center w-full px-8 gap-6">
        <View className="gap-2">
          <Text variant="h1">Inbjudan skickad</Text>
          <Text>
            När personen du bjudit in accepterar kopplas era konton ihop. Du
            hittar dina inbjudningar under kontoinställningar.
          </Text>
        </View>

        <FormMessage>Inbjudan är skickad!</FormMessage>

        <Button
          variant="secondary"
          onPress={() => completeOnboarding()}
          className="px-10 self-start"
        >
          <Text>Fortsätt</Text>
        </Button>
      </View>
    );
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
          onOpenChange={(open) => {
            setInvitationDialogOpen(open);
            if (!open) setError(null);
          }}
          onAction={onInvite}
          isLoading={isLoading}
          error={error}
        />
      )}

      {error && !invitationDialogOpen && <FormError>{error}</FormError>}

      <View className="gap-2 items-start">
        <Button
          variant="secondary"
          onPress={() => {
            setError(null);
            setInvitationDialogOpen(true);
          }}
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
