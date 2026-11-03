import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { GroupMember } from "@/types/connected-accounts";
import { Image } from "expo-image";
import { LogOut, Trash, User } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import InfoMessage from "../info-message";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function ConnectedAccountsSettings({
  accounts,
}: {
  accounts: ConnectedAccounts;
}) {
  const {
    members,
    isInGroup,
    isLoading,
    error,
    isSubmitting,
    actionError,
    groupNotice,
    dismissGroupNotice,
    removeMember,
    leaveGroup,
  } = accounts;
  // The member to remove, null = dialog closed
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(
    null,
  );
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const displayError = error || actionError;
  const isBusy = isLoading || isSubmitting;

  async function onRemoveMember() {
    if (!memberToRemove) return;
    await removeMember(memberToRemove.id);
    setMemberToRemove(null);
  }

  async function onLeaveGroup() {
    await leaveGroup();
    setLeaveDialogOpen(false);
  }

  return (
    <View className="gap-4">
      <Text variant="h2">Kopplade konton</Text>

      {displayError && <FormError>{displayError}</FormError>}
      {groupNotice && (
        <InfoMessage onDismiss={dismissGroupNotice}>{groupNotice}</InfoMessage>
      )}

      {isBusy ? (
        <Text>Laddar...</Text>
      ) : !isInGroup ? (
        <Text>Du har inga kopplade konton ännu.</Text>
      ) : (
        <View className="gap-2">
          <Text>Tryck på namnet för att se kontots mailadress.</Text>
          {members.map((m) => (
            <View key={m.id} className="flex-row justify-between items-center">
              {/* Avatar and name */}
              <View>
                <Tooltip>
                  <TooltipTrigger className="flex-row items-center gap-3">
                    {m.avatarUrl ? (
                      <Image
                        source={m.avatarUrl}
                        style={{ width: 32, height: 32, borderRadius: 24 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="size-8 rounded-full bg-muted items-center justify-center">
                        <Icon as={User} size={22} />
                      </View>
                    )}
                    <Text variant="bold" className="max-w-44">
                      {m.name}
                    </Text>
                  </TooltipTrigger>
                  <TooltipContent align="start">
                    <Text>{m.email}</Text>
                  </TooltipContent>
                </Tooltip>
              </View>

              {/* Remove text and trash icon */}
              <Button
                variant="destructive"
                aria-label={`Ta bort ${m.name}`}
                onPress={() => setMemberToRemove(m)}
                disabled={isSubmitting}
                className="px-2 items-center"
              >
                <Text>Ta bort</Text>
                <Icon as={Trash} size={20} className="size-5" />
              </Button>
            </View>
          ))}

          <Button
            variant="outline"
            onPress={() => setLeaveDialogOpen(true)}
            disabled={isSubmitting}
            className="self-start mt-2"
          >
            <Text>Lämna gruppen</Text>
            <Icon as={LogOut}></Icon>
          </Button>
        </View>
      )}

      {/* One dialog for all members, outside the list */}
      <ConfirmDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title={"Är du säker?"}
        description={`Om du tar bort ${memberToRemove?.name ?? "kontot"} kan ni inte längre se varandras listor eller er gemensamma lista. Om du blir ensam kvar i en grupp försvinner din grupptillhörighet.`}
        actionLabel={"Bekräfta radering"}
        onAction={onRemoveMember}
        cancelLabel={"Avbryt"}
        onCancel={() => setMemberToRemove(null)}
        isLoading={isBusy}
      />

      <ConfirmDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        title={"Lämna gruppen?"}
        description={
          "Du kommer inte längre kunna se de andras listor eller er gemensamma lista. Om du blir ensam kvar i en grupp försvinner din grupptillhörighet."
        }
        actionLabel={"Lämna gruppen"}
        onAction={onLeaveGroup}
        cancelLabel={"Avbryt"}
        onCancel={() => setLeaveDialogOpen(false)}
        isLoading={isBusy}
      />
    </View>
  );
}
