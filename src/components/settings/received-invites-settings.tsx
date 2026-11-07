import { useAnswerInvite } from "@/hooks/useAnswerInvite";
import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function ReceivedInvitesSettings({
  accounts,
}: {
  accounts: ConnectedAccounts;
}) {
  const { receivedInvites, isSubmitting } = accounts;
  const { answeredInvite, onAnswer } = useAnswerInvite(accounts);

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
