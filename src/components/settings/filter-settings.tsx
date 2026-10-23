import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function FilterSettings() {
  return (
    <View className="gap-2">
      <Text variant="h2">Din bevakning</Text>
      <Button
        onPress={() => router.push("/update-filter")}
        className="max-w-48"
      >
        <Text>Uppdatera bevakning</Text>
      </Button>
    </View>
  );
}
