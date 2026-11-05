import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import { Icon } from "../ui/icon";
import { Check, X } from "lucide-react-native";

type InvitationUpdateProps = {
  fromUserId: string;
  fromUserName: string;
};

export default function InviteUpdate({
  fromUserId,
  fromUserName,
}: InvitationUpdateProps) {
  return (
    <>
      <View className="flex-row justify-between items-center gap-2">
        <View className="flex-1">
          <Text variant="bold">Koppla konto</Text>
          <Text>{fromUserName} har bjudit in dig till sin grupp.</Text>
        </View>
        <View className="gap-2">
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push(`/(tabs)/search`)}
            className="max-h-7 justify-between"
            >
            <Text>Acceptera</Text>
            <Icon as={Check} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push(`/(tabs)/search`)}
            className="max-h-7 justify-between"
          >
            <Text>Avböj</Text>
            <Icon as={X} />
          </Button>
        </View>
      </View>
    </>
  );
}
