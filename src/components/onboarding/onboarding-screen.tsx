import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowLeftIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

type AuthScreenProps = {
  children: ReactNode;
  backButton?: boolean;
};

export function OnboardingScreen({ children, backButton }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-primary px-4 pb-8"
    >
      {/* Background image */}
      <Image
        source={require("@/assets/images/img.jpg")}
        style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
        contentFit="cover"
      />

      {/* Avoid keyboard from hiding input fields */}
      <KeyboardAvoidingView className="flex-1 w-full" behavior="padding">
        <View className="flex-row items-start mt-4">
          {backButton && (
            <Button variant="link" onPress={() => router.back()} className="py-0">
              <Icon as={ArrowLeftIcon} />
              <Text>Tillbaka</Text>
            </Button>
          )}
          <View className="ml-auto">
            <Image
              source={require("@/assets/logos/logo-g-primary.svg")}
              style={{ width: 90, height: 40 }}
              contentFit="contain"
            />
          </View>
        </View>
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
