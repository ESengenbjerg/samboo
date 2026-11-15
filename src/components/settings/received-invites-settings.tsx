import { useAnswerInvite } from "@/hooks/groups/useAnswerInvite";
import { ConnectedAccounts } from "@/hooks/groups/useConnectedAccounts";
import { Answer } from "@/stores/answered-invite";
import { showToast } from "@/stores/toast";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function ReceivedInvitesSettings({
  accounts,
}: {
  accounts: ConnectedAccounts;
}) {
  const { receivedInvites, isSubmitting } = accounts;
  const { onAnswer } = useAnswerInvite(accounts);

  // The full confirmation is on the notifications page, here a toast is enough
  async function handleAnswer(inviteId: number, answer: Answer) {
    const ok = await onAnswer(inviteId, answer);
    if (ok) {
      showToast(
        answer === "accepted" ? "Inbjudan godkänd!" : "Inbjudan nekad.",
        "success",
      );
    }
  }

  return (
    <View className="gap-4">
      <Text variant="h2">Mottagna inbjudningar</Text>
      {receivedInvites.length === 0 && (
        <Text>Du har inga obesvarade inbjudningar.</Text>
      )}

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
              onPress={() => handleAnswer(i.id, "accepted")}
              disabled={isSubmitting}
              variant="secondary"
              className="w-40"
            >
              <Text>Acceptera</Text>
            </Button>
            <Button
              onPress={() => handleAnswer(i.id, "declined")}
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
