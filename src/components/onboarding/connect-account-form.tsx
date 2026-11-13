import { useSession } from "@/hooks/auth/useSession";
import { useAnswerInvite } from "@/hooks/useAnswerInvite";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { getCurrentUser } from "@/services/auth";
import {
  createInvite,
  inviteErrorMessage,
  validateInviteEmails,
} from "@/services/invites";
import { saveOnboarding } from "@/services/onboarding";
import { useOnboardingStore } from "@/stores/onboarding";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { SendInviteDialog } from "../modals/send-invite-dialog";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

type ConnectAccountFormProps = {
  // Called when the "Inbjudan skickad" screen is shown. Everything is saved then,
  // so the screen hides "Tillbaka"
  onInviteSent?: () => void;
};

export default function ConnectAccountForm({
  onInviteSent,
}: ConnectAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const inFlight = useRef(false);
  const saved = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  // Invites to me, so an invited partner can accept instead of inviting back.
  // The database allows answering before onboarding is completed
  const { session } = useSession();
  const accounts = useConnectedAccounts(session?.user.id);
  const { receivedInvites, isSubmitting, actionError } = accounts;
  const { answeredInvite, answeredFromName, onAnswer, clearAnswer } =
    useAnswerInvite(accounts);

  async function finish() {
    setError(null);
    if (saved.current === true) {
      return true;
    }
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
      // A retry after a failed invite must not save everything again
      saved.current = true;

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

  // Blocks double taps: isLoading is set after an await, too late to stop a second tap.
  // finally releases the lock on every exit, including the early returns
  async function withLock<T>(blocked: T, action: () => Promise<T>) {
    if (inFlight.current) return blocked;
    inFlight.current = true;
    try {
      return await action();
    } finally {
      inFlight.current = false;
    }
  }

  function onInvite(emails: string[]) {
    return withLock(emails, () => sendInvites(emails));
  }

  // Save onboarding, then send invites to other users
  async function sendInvites(emails: string[]) {
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
      // Only reached after finish() succeeded, so the profile is saved
      setError(`${lastError} Din profil och bevakning är sparade.`);
      return failed;
    }

    // All invites sent: close dialog and show success view
    setInvitationDialogOpen(false);
    setInviteSent(true);
    onInviteSent?.();
    return [];
  }

  function onSkip() {
    return withLock(undefined, async () => {
      const finished = await finish();
      if (finished) finishOnboarding();
    });
  }

  // The answer belongs to onboarding. Clear it, otherwise it shows up under "Idag"
  // on the notifications page the first time it is opened, maybe days later
  function finishOnboarding() {
    completeOnboarding();
    clearAnswer();
  }

  // Shown after accepting an invite. Fortsätt saves onboarding like Hoppa över
  if (answeredInvite === "accepted") {
    return (
      <View className="flex-1 justify-center w-full px-8 gap-6">
        <View className="gap-2">
          <Text variant="h1">Konton kopplade</Text>
          <Text>
            {`Du och ${answeredFromName ?? "din grupp"} kan nu se varandras sparade objekt och visningstider.`}
          </Text>
        </View>

        {error && <FormError>{error}</FormError>}

        <Button
          variant="secondary"
          onPress={onSkip}
          disabled={isLoading}
          className="px-10 self-start"
        >
          <Text>{isLoading ? "Sparar..." : "Fortsätt"}</Text>
        </Button>
      </View>
    );
  }

  // Shown after invites are sent. The user decides when to continue
  if (inviteSent) {
    return (
      <View className="flex-1 justify-center w-full px-8 gap-6">
        <View className="gap-2">
          <Text variant="h1">Inbjudan skickad</Text>
          <Text>
            När personen du bjudit in accepterar kopplas era konton ihop. Du
            hittar dina inbjudningar under Inställningar.
          </Text>
        </View>

        <Button
          variant="secondary"
          onPress={finishOnboarding}
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
          varandras sparade objekt och gemensamma visningstider.
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
          memberCount={accounts.members.length}
          isLoading={isLoading}
          error={error}
        />
      )}

      {receivedInvites.map((i) => (
        <View key={i.id} className="gap-2">
          <Text variant="bold">
            {`${i.from_name} (${i.from_email}) har bjudit in dig till sin grupp.`}
          </Text>
          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              onPress={() => onAnswer(i.id, "accepted")}
              disabled={isSubmitting || isLoading}
            >
              <Text>Acceptera</Text>
            </Button>
            <Button
              variant="destructive"
              onPress={() => onAnswer(i.id, "declined")}
              disabled={isSubmitting || isLoading}
            >
              <Text>Avböj</Text>
            </Button>
          </View>
        </View>
      ))}

      {answeredInvite === "declined" && <Text>Inbjudan nekad.</Text>}
      {actionError && <FormError>{actionError}</FormError>}

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
        <Text>Det här kan du också göra senare under Inställningar.</Text>
        <Button
          variant="link"
          className="p-0"
          onPress={onSkip}
          disabled={isLoading}
        >
          <Text>{isLoading ? "Sparar..." : "Hoppa över"}</Text>
        </Button>
      </View>
    </View>
  );
}
