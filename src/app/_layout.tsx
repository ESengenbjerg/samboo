import "../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "nativewind";

import { NAV_THEME } from "@/lib/theme";
import { Pressable, Text, View } from "react-native";
import { useState } from "react";


export default function RootLayout() {
  {/* TODO: Update to correct states */}
  const hasOnboarded = true;
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true)
  
  const { colorScheme } = useColorScheme();


  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
      
      {/* ONLY FOR DEV -- LOG IN TOGGLE */}
      {/* TODO: Remove before production */}
      <View>
        <Pressable onPress={() => setIsLoggedIn(!isLoggedIn)}>
          {!isLoggedIn ? (
            <Text>Log in</Text>
          ) : (
            <Text>Log out</Text>
          )}
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
