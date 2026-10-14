import "../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "nativewind";

import { Text } from "@/components/ui/text";
import { NAV_THEME } from "@/lib/theme";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

// Fonts
import { MomoTrustDisplay_400Regular } from "@expo-google-fonts/momo-trust-display";
import {
  MomoTrustSans_400Regular,
  MomoTrustSans_500Medium,
  MomoTrustSans_700Bold,
} from "@expo-google-fonts/momo-trust-sans";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

// Stays on start screen until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    MomoTrustDisplay_400Regular,
    MomoTrustSans_400Regular,
    MomoTrustSans_500Medium,
    MomoTrustSans_700Bold,
  });

  // TODO: Update to correct states
  const hasOnboarded = false;
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const { colorScheme } = useColorScheme();

  // Leave start screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
      {/* ONLY FOR DEV -- LOG IN TOGGLE */}
      {/* TODO: Remove before production */}
      <View>
        <Pressable onPress={() => setIsLoggedIn(!isLoggedIn)}>
          {!isLoggedIn ? <Text>Log in</Text> : <Text>Log out</Text>}
        </Pressable>
      </View>
      {/* --- */}

      {/* Redirects user to correct view */}
      {/* TODO: Update to correct states */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isLoggedIn && !hasOnboarded}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={isLoggedIn && hasOnboarded}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}
