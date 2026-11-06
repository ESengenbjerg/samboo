import { nameEndsWithS } from "@/utils/name-ends-with-s";
import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

type GroupUpdateProps = {
  memberId: string;
  memberName: string;
  newCount: number;
};

export default function GroupUpdateNotification({
  memberId,
  memberName,
  newCount,
}: GroupUpdateProps) {
  // Same params as listButton, so the list page gets the right title
  function onPress() {
    router.push({
      pathname: "/saved/[listId]",
      params: {
        listId: memberId,
        title: `${nameEndsWithS(memberName)} lista`,
      },
    });
  }

  return (
    <>
      <Separator />
      <View className="flex-row justify-between items-center gap-2">
        <View className="flex-1">
          <Text variant="bold">
            {newCount === 1
              ? `${memberName} har sparat en bostad du inte sett!`
              : `${memberName} har sparat ${newCount} bostäder du inte sett!`}
          </Text>
          <Text>
            {newCount === 1
              ? "Se om den faller dig i smaken."
              : "Se om de faller dig i smaken."}
          </Text>
        </View>
        <Button size="sm" onPress={onPress} className="max-h-7">
          <Text>Visa</Text>
        </Button>
      </View>
    </>
  );
}
