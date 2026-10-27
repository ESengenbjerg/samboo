import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { GroupMember } from "@/types/connected-accounts";
import { Image } from "expo-image";
import { LogOut, Trash } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

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
    removeMember,
    leaveGroup,
  } = accounts;
  // The member to remove, null = dialog closed
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(
    null,
  );
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

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

      {error && <FormError>{error}</FormError>}
      {actionError && <FormError>{actionError}</FormError>}

      {isLoading ? (
        <Text>Laddar...</Text>
      ) : !isInGroup ? (
        <Text>Du har inga kopplade konton ännu.</Text>
      ) : (
        <View className="gap-2">
          {members.map((m) => (
            <View key={m.id} className="flex-row justify-between items-center">
              {/* Avatar and name */}
              <View className="flex-row items-center gap-3">
                {m.avatarUrl ? (
                  <Image
                    source={m.avatarUrl}
                    style={{ width: 16, height: 16, borderRadius: 8 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="size-4 rounded-full bg-muted" />
                )}
                <Text>{m.name}</Text>
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
        description={`Om du tar bort ${memberToRemove?.name ?? "kontot"} kan ni inte längre se varandras listor eller er gemensamma lista.`}
        actionLabel={"Bekräfta radering"}
        onAction={onRemoveMember}
        cancelLabel={"Avbryt"}
        onCancel={() => setMemberToRemove(null)}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        title={"Lämna gruppen?"}
        description={
          "Du kommer inte längre kunna se de andras listor eller er gemensamma lista."
        }
        actionLabel={"Lämna gruppen"}
        onAction={onLeaveGroup}
        cancelLabel={"Avbryt"}
        onCancel={() => setLeaveDialogOpen(false)}
        isLoading={isSubmitting}
      />
    </View>
  );
}
