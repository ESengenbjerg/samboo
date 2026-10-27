import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useState } from "react";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function ReceivedInvitesSettings({
  accounts,
}: {
  accounts: ConnectedAccounts;
}) {
  const { receivedInvites, acceptInvite, declineInvite, isSubmitting } =
    accounts;
  const [answeredInvite, setAnsweredInvite] = useState<
    "accepted" | "declined" | null
  >(null);

  // Only show the confirmation if the database call succeeded
  async function onAnswer(inviteId: number, answer: "accepted" | "declined") {
    const ok =
      answer === "accepted"
        ? await acceptInvite(inviteId)
        : await declineInvite(inviteId);
    if (ok) setAnsweredInvite(answer);
  }

  return (
    <View className="gap-4">
      <Text variant="h2">Mottagna inbjudningar</Text>
      {receivedInvites.length === 0 && answeredInvite == null && (
        <Text>Du har inga obesvarade inbjudningar.</Text>
      )}

      {answeredInvite === "accepted" && <Text>Inbjudan godkänd!</Text>}
      {answeredInvite === "declined" && <Text>Inbjudan nekad.</Text>}

      {receivedInvites.map((i) => (
        <View key={i.id} className="gap-4">
          <View className="gap-2">
            <Text>
              {i.from_name} ({i.from_email}) har bjudit in dig till sin grupp.
            </Text>
            <Text variant="bold">Vill du gå med?</Text>
          </View>
          <View className="flex-row gap-2">
            <Button
              onPress={() => onAnswer(i.id, "accepted")}
              disabled={isSubmitting}
              variant="secondary"
              className="w-40"
            >
              <Text>Acceptera</Text>
            </Button>
            <Button
              onPress={() => onAnswer(i.id, "declined")}
              disabled={isSubmitting}
              variant="destructive"
              className="w-40"
            >
              <Text>Avböj</Text>
            </Button>
          </View>
        </View>
      ))}
    </View>
  );
}
