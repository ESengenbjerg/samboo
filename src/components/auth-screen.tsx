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

export function AuthScreen({ children }: AuthScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-foreground">
      {/* Background image */}
      <Image
        source={require("@/assets/images/img.jpg")}
        style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
        contentFit="cover"
      />

      {/* Avoid keyboard from hiding input fields */}
      <KeyboardAvoidingView behavior="padding">
        <ScrollView
          contentContainerClassName="flex-grow items-center py-10"
          keyboardShouldPersistTaps="handled" // Allows only on tap to close keyboard
        >
          <Link href="/login" dismissTo asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Till inloggning"
            >
              <Image
                source={require("@/assets/logos/logo-y-primary.svg")}
                style={{ width: 150, height: 90 }}
                contentFit="contain"
              />
            </Pressable>
          </Link>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
