import { AuthScreen } from "@/components/auth-screen";
import { SignInForm } from "@/components/sign-in-form";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

export default function LoginScreen() {
  return (
    <AuthScreen>
      <SignInForm />
    </AuthScreen>
  );
}
