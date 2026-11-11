import { Text } from "@/components/ui/text";
import { ScrollView, View } from "react-native";

// Admin view for the product owner. Only reachable for admins, see the guard in _layout.tsx
export default function AdminScreen() {
  return (
    <ScrollView className="bg-background" contentContainerClassName="pb-8">
      <View className="flex-1 px-8 bg-background gap-8">
        <Text variant="h1">Administration</Text>
      </View>
    </ScrollView>
  );
}
