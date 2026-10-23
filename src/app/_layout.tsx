import "../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "nativewind";

import { NAV_THEME } from "@/lib/theme";
import { useEffect } from "react";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useSession } from "@/hooks/useSession";
import { signOut } from "@/services/auth";
import { useOnboardingStore } from "@/stores/onboarding";
import { MomoTrustDisplay_400Regular } from "@expo-google-fonts/momo-trust-display";
import {
  MomoTrustSans_400Regular,
  MomoTrustSans_500Medium,
  MomoTrustSans_700Bold,
} from "@expo-google-fonts/momo-trust-sans";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Stays on start screen until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    MomoTrustDisplay_400Regular,
    MomoTrustSans_400Regular,
    MomoTrustSans_500Medium,
    MomoTrustSans_700Bold,
  });
  const { colorScheme } = useColorScheme();

  const { session, isSessionLoaded } = useSession();
  const userId = session?.user.id;
  const { status: profile, retry: retryProfile } = useOnboardingStatus(userId);

  const onboardingComplete = useOnboardingStore((s) => s.onboardingComplete);

  const isLoggedIn = !!session;
  const isOnboarded = (profile?.isOnboarded ?? false) || onboardingComplete;
  const isProfileLoading = isLoggedIn && profile?.userId !== userId;
  const isReady = fontsLoaded && isSessionLoaded && !isProfileLoading;

  // Leave start screen when everything is loaded
  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

  if (profile?.failed) {
    return (
      <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
        <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
          <Text>Kunde inte hämta din profil.</Text>
          {/* "Försök igen" (Try again) refetches the profile */}
          <Button onPress={retryProfile}>
            <Text>Försök igen</Text>
          </Button>
          <Button variant="link" onPress={() => signOut()}>
            <Text>Logga ut</Text>
          </Button>
        </View>
      </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
        {/* Redirects user to correct view */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={isLoggedIn && !isOnboarded}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>
          <Stack.Protected guard={isLoggedIn && isOnboarded}>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: true, header: () => <Header /> }}
            />
          </Stack.Protected>
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
