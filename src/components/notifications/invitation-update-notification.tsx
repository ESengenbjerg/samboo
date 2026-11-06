import { useAnswerInvite } from "@/hooks/useAnswerInvite";
import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { Check, X } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

type InvitationUpdateProps = {
  accounts: ConnectedAccounts;
};

export default function InviteUpdateNotification({ accounts }: InvitationUpdateProps) {
  const { receivedInvites, isSubmitting, actionError } = accounts;
  const { answeredInvite, onAnswer } = useAnswerInvite(accounts);

  if (receivedInvites.length === 0 && answeredInvite == null) return null;

  return (
    <>
      {answeredInvite != null && (
        <>
          <Separator />
          <View className="flex-row justify-between items-center">
            <Text>
              {answeredInvite === "accepted"
                ? "Inbjudan godkänd!"
                : "Inbjudan nekad."}
            </Text>
            {answeredInvite === "accepted" ? (
              <Button
                size="sm"
                variant="secondary"
                disabled
                className="max-h-7 justify-between"
              >
                <Text>Accepterad</Text>
                <Icon as={Check} />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                disabled
                className="max-h-7 justify-between"
              >
                <Text>Avböjt</Text>
                <Icon as={X} />
              </Button>
            )}
          </View>
        </>
      )}

      {receivedInvites.map((i) => (
        <View key={i.id} className="gap-6">
          <Separator />
          <View className="flex-row justify-between items-center gap-2">
            <View className="flex-1">
              <Text variant="bold">Koppla konto</Text>
              <Text>{i.from_name} har bjudit in dig till sin grupp.</Text>
              <Text>({i.from_email}) </Text>
            </View>
            <View className="gap-2">
              <Button
                size="sm"
                variant="outline"
                onPress={() => onAnswer(i.id, "accepted")}
                disabled={isSubmitting}
                className="max-h-7 justify-between"
              >
                <Text>Acceptera</Text>
                <Icon as={Check} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => onAnswer(i.id, "declined")}
                disabled={isSubmitting}
                className="max-h-7 justify-between"
              >
                <Text>Avböj</Text>
                <Icon as={X} />
              </Button>
            </View>
          </View>
        </View>
      ))}
      {actionError != null && <Text>{actionError}</Text>}
    </>
  );
}
