import "../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "nativewind";

import { NAV_THEME } from "@/lib/theme";
import { useEffect, useState } from "react";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useProfile } from "@/hooks/use-profile";
import { signOut } from "@/services/auth";
import { useOnboardingStore } from "@/stores/onboarding";
import { supabase } from "@/utils/supabase";
import { MomoTrustDisplay_400Regular } from "@expo-google-fonts/momo-trust-display";
import {
  MomoTrustSans_400Regular,
  MomoTrustSans_500Medium,
  MomoTrustSans_700Bold,
} from "@expo-google-fonts/momo-trust-sans";
import { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Stays on start screen until fonts are loaded
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const [fontsLoaded] = useFonts({
    MomoTrustDisplay_400Regular,
    MomoTrustSans_400Regular,
    MomoTrustSans_500Medium,
    MomoTrustSans_700Bold,
  });
  const { colorScheme } = useColorScheme();

  const [session, setSession] = useState<Session | null>(null);
  // True once the stored session has been read (it can be null = logged out)
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  // Load session and listen to login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsSessionLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Resets cache and onboarding to not affect next user.
        // Will be read from Supabase next time
        queryClient.clear();
        useOnboardingStore.getState().reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get onboarding status when a user is logged in
  const isLoggedIn = !!session;
  const profileQuery = useProfile({ enabled: isLoggedIn });
  const profileFailed = profileQuery.isError && !profileQuery.data;

  const onboardingComplete = useOnboardingStore((s) => s.onboardingComplete);

  const isOnboarded =
    !!profileQuery.data?.onboarding_completed_at || onboardingComplete;
  const isProfileLoading = isLoggedIn && profileQuery.isPending;
  const isReady = fontsLoaded && isSessionLoaded && !isProfileLoading;

  // Leave start screen when everything is loaded
  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

  if (profileFailed) {
    return (
      <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>
        <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
          <Text>Kunde inte hämta din profil.</Text>
          <Button
            onPress={() => profileQuery.refetch()}
          >
            <Text>Försök igen</Text>
          </Button>
          <Button variant="link" onPress={() => signOut().catch(() => {})}>
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
