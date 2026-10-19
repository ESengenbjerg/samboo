import { AuthScreen } from "@/components/auth-screen";
import { SignUpForm } from "@/components/sign-up-form";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

export default function RegisterScreen() {
  return (
    <AuthScreen>
      <SignUpForm />
    </AuthScreen>
  );
}
