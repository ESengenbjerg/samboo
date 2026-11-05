import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

type FeedUpdateProps = {
  newObjects: number;
};

export default function FeedUpdate({ newObjects }: FeedUpdateProps) {
  return (
    <>
      <View className="flex-row justify-between items-center gap-2">
        <View className="flex-1">
          <Text variant="bold">{newObjects} nya bostäder!</Text>
          <Text>Det har dykt upp nya bostäder i din bevakning.</Text>
        </View>
        <Button
          size="sm"
          onPress={() => router.push(`/(tabs)/search`)}
          className="max-h-7"
        >
          <Text>Visa</Text>
        </Button>
      </View>
    </>
  );
}
