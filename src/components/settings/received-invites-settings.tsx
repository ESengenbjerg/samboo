import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
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

  return (
    <View className="gap-4">
      <Text variant="h2">Mottagna inbjudningar</Text>
      {receivedInvites.length === 0 && (
        <Text>Du har inga obesvarade inbjudningar.</Text>
      )}
      {receivedInvites.map((i) => (
        <View key={i.id}>
          <View>
            <Text>{i.from_name}</Text>
            <Text>{i.from_email}</Text>
          </View>
          <View>
            <Button onPress={() => acceptInvite(i.id)} disabled={isSubmitting}>
              <Text>Acceptera</Text>
            </Button>
            <Button onPress={() => declineInvite(i.id)} disabled={isSubmitting}>
              <Text>Avböj</Text>
            </Button>
          </View>
        </View>
      ))}
    </View>
  );
}
