import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

type GroupUpdateProps = {
  memberId: string;
  memberName: string;
};

export default function GroupUpdate({
  memberId,
  memberName,
}: GroupUpdateProps) {
  return (
    <>
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text variant="bold">{memberName} har sparat en bostad!</Text>
          <Text>Se efter om den är av intresse.</Text>
        </View>
        <Button
          size="sm"
          onPress={() => router.push(`/(tabs)/saved/${memberId}`)}
          className="max-h-7"
        >
          <Text>Visa</Text>
        </Button>
      </View>
    </>
  );
}
