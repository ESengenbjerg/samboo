import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function RegisterScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text>Skapa konto</Text>

      <Link href="/register">Glömt lösenord</Link>
      <Text> | </Text>
      <Link href="/register">Logga in</Link>
    </View>
  );
}
