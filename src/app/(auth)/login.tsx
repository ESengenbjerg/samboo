import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text>Logga in</Text>

      <Link href="/register">Glömt lösenord</Link>
      <Text> | </Text>
      <Link href="/register">Skapa profil</Link>
    </View>
  );
}
