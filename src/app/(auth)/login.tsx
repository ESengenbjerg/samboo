import { SignInForm } from "@/components/sign-in-form";
import { View } from "react-native";

export default function LoginScreen() {
  return (
    <View className="flex-1 items-center gap-2 justify-center bg-foreground">
      <SignInForm></SignInForm>
    </View>
  );
}
