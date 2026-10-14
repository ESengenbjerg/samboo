import { Text } from "@/components/ui/text";
import { Link } from "expo-router";
import { View } from "react-native";

export default function RegisterScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text>Skapa konto</Text>

      <View className="flex-row gap-4 mt-8">
        <Link href="/register" asChild>
          <Text>Glömt lösenord</Text>
        </Link>
        <Text> | </Text>
        <Link href="/login" asChild>
          <Text>Logga in</Text>
        </Link>
      </View>
    </View>
  );
}
