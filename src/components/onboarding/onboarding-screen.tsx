import { Image } from "expo-image";
import { Link } from "expo-router";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import type { ReactNode } from "react";

type AuthScreenProps = {
  children: ReactNode;
};

export function OnboardingScreen({ children }: AuthScreenProps) {
  return (
    <View className="flex-1 bg-primary">
      {/* Background image */}
      <Image
        source={require("@/assets/images/img.jpg")}
        style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
        contentFit="cover"
      />

      {/* Avoid keyboard from hiding input fields */}
      <KeyboardAvoidingView className="flex-1 w-full" behavior="padding">
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center gap-6 py-10"
          keyboardShouldPersistTaps="handled" // Buttons work on first tap while keyboard is open
        >

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
