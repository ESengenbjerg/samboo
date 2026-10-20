import { Image } from "expo-image";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AuthScreenProps = {
  children: ReactNode;
};

export function OnboardingScreen({ children }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-primary px-4 pb-8">
      {/* Background image */}
      <Image
        source={require("@/assets/images/img.jpg")}
        style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
        contentFit="cover"
      />

      {/* Avoid keyboard from hiding input fields */}
      <KeyboardAvoidingView className="flex-1 w-full" behavior="padding">
        <Image
          source={require("@/assets/logos/logo-g-primary.svg")}
          style={{ width: 90, height: 40 }}
          contentFit="contain"
          className="items-start"
        />
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
