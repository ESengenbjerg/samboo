import { Text } from "@/components/ui/text";
import { Link } from "expo-router";
import { View } from "react-native";

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text>Logga in</Text>

      <View className="flex-row gap-4 mt-8">
        <Link href="/register" asChild>
          <Text>Glömt lösenord</Text>
        </Link>
        <Text> | </Text>
        <Link href="/register" asChild>
          <Text>Skapa profil</Text>
        </Link>
      </View>
    </View>
  );
}
