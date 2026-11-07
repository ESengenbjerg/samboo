import { AnsweredInvite } from "@/types/notifications";
import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

type AnsweredInviteNotificationProps = {
  invite: AnsweredInvite;
};

// One notification per answered invite. The list is built by useAnsweredInvites()
export default function AnsweredInviteNotification({
  invite,
}: AnsweredInviteNotificationProps) {
  const isAccepted = invite.status === "accepted";
  // The name is only known if tthe recipient is in my group
  const who = invite.name ?? invite.to_email;

  return (
    <>
      <Separator />
      <View className="flex-row gap-2 justify-between items-center">
        <View className="flex-1">
            <Text variant="bold">
              {isAccepted
                ? "Din inbjudan har accepterats!"
                : "Din inbjudan har avböjts."}
            </Text>
          <Text>
            {isAccepted
              ? `Du och ${who} kan nu se varandras listor.`
              : `Du kan skicka en ny inbjudan till ${who} under inställningar.`}
          </Text>
        </View>

        {isAccepted && (
          <Button
            size="sm"
            onPress={() => router.push("/saved")}
            className="max-h-7"
          >
            <Text>Visa</Text>
          </Button>
        )}
      </View>
    </>
  );
}
