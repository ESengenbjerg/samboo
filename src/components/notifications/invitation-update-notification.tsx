import { useAnswerInvite } from "@/hooks/useAnswerInvite";
import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { router } from "expo-router";
import { Check, X } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

type InvitationUpdateProps = {
  accounts: ConnectedAccounts;
};

export default function InviteUpdateNotification({
  accounts,
}: InvitationUpdateProps) {
  const { receivedInvites, isSubmitting, actionError } = accounts;
  const { answeredInvite, answeredFromName, onAnswer } =
    useAnswerInvite(accounts);

  if (receivedInvites.length === 0 && answeredInvite == null) return null;

  return (
    <>
      {answeredInvite != null && (
        <>
          <Separator />
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text variant="bold">
                {answeredInvite === "accepted"
                  ? "Inbjudan godkänd!"
                  : "Inbjudan nekad."}
              </Text>
              <Text>
                {answeredInvite === "accepted"
                  ? `Du och ${answeredFromName ?? "din grupp"} kan nu se varandras listor.`
                  : "Inbjudan nekad."}
              </Text>
            </View>

            {answeredInvite === "accepted" ? (
              <Button
                size="sm"
                onPress={() => router.push("/saved")}
                className="max-h-7"
              >
                <Text>Visa</Text>
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
              <Text>
                {i.from_name} ({i.from_email}) har bjudit in dig till sin grupp.
              </Text>
            </View>
            <View className="gap-1">
              <Button
                size="sm"
                variant="secondary"
                onPress={() => onAnswer(i.id, "accepted")}
                disabled={isSubmitting}
                className="max-h-7 justify-between"
              >
                <Text>Acceptera</Text>
                <Icon as={Check} />
              </Button>
              <Button
                size="sm"
                variant="destructive"
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
