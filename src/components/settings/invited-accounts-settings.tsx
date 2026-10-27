import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { SentInvite } from "@/types/connected-accounts";
import { X } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { SendInviteDialog } from "../modals/send-invite-dialog";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

export default function ConnectAccountsSettings({
  accounts,
}: {
  accounts: ConnectedAccounts;
}) {
  const {
    pendingSentInvites,
    sendInvite,
    cancelInvite,
    isSubmitting,
    actionError,
    clearActionError,
  } = accounts;
  // The invite to cancel, null = dialog closed
  const [inviteToCancel, setInviteToCancel] = useState<SentInvite | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  function openInviteDialog() {
    clearActionError();
    setInviteDialogOpen(true);
  }

  async function onInvite(email: string) {
    const ok = await sendInvite(email);
    if (ok) setInviteDialogOpen(false);
  }

  async function onCancelInvite() {
    if (!inviteToCancel) return;
    await cancelInvite(inviteToCancel.id);
    setInviteToCancel(null);
  }

  return (
    <View className="gap-6">
      <View className="gap-6">
        <View>
          <Text variant="h2">Bjud in konto</Text>
          <Text>
            Koppla ihop ditt konto med ett eller flera andra för att kunna se
            varandras sparade objekt och gemensamma visningstider.
          </Text>
        </View>
        <Button onPress={openInviteDialog} className="w-36">
          <Text>Bjud in konto</Text>
        </Button>
      </View>

      {inviteDialogOpen && (
        <SendInviteDialog
          open={inviteDialogOpen}
          onOpenChange={(open) => {
            setInviteDialogOpen(open);
            if (!open) clearActionError();
          }}
          onAction={onInvite}
          isLoading={isSubmitting}
          error={inviteDialogOpen ? actionError : null}
        />
      )}

      <View className="gap-1">
        {pendingSentInvites.map((i) => (
          <View key={i.id} className="flex-row justify-between items-center">
            {/* Avatar and name */}
            <View className="justify-start">
              <Text variant="bold">{i.to_email}</Text>
              <Text>Väntar på svar</Text>
            </View>

            {/* Remove text and trash icon */}
            <Button
              variant="destructive"
              aria-label="Avbryt inbjudan"
              onPress={() => setInviteToCancel(i)}
              className="px-2 items-center"
            >
              <Text>Avbryt</Text>
              <Icon as={X} size={20} className="size-5" />
            </Button>
          </View>
        ))}

        <ConfirmDialog
          open={!!inviteToCancel}
          onOpenChange={(open) => !open && setInviteToCancel(null)}
          title={"Är du säker?"}
          description={`Vill du dra tillbaka inbjudan till ${inviteToCancel?.to_email}?`}
          actionLabel={"Dra tillbaka"}
          onAction={onCancelInvite}
          cancelLabel={"Avbryt"}
          onCancel={() => setInviteToCancel(null)}
          isLoading={isSubmitting}
        />
      </View>
    </View>
  );
}
