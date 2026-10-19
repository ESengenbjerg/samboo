import { SignInForm } from "@/components/sign-in-form";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center gap-2 justify-center bg-foreground">
      <Image
        source={require("@/assets/images/img.jpg")}
        style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
        contentFit="cover"
      />
      <SignInForm />
    </View>
  );
}
