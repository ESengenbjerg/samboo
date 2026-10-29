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
  const {
    receivedInvites,
    acceptInvite,
    declineInvite,
    isSubmitting,
    skippedShowings,
  } = accounts;
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
      {answeredInvite === "accepted" && skippedShowings.length > 0 && (
        <View>
          <Text>
            Gruppen hade redan visningar för de här bostäderna, så dina
            visningar för dem togs bort:
          </Text>
          {skippedShowings.map((s) => (
            // TODO: Use same date/time logic as in showings list
            <Text key={s.url} variant="bold">
              {s.address ?? "Okänd adress"}, {s.showing_date}
              {s.start_time ? ` kl. ${s.start_time.slice(0, 5)}` : ""}
            </Text>
          ))}
        </View>
      )}
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
