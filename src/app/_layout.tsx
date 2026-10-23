import "../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "nativewind";

import { NAV_THEME } from "@/lib/theme";
import { useEffect, useState } from "react";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useOnboardingStore } from "@/stores/onboarding";
import { supabase } from "@/utils/supabase";
import { MomoTrustDisplay_400Regular } from "@expo-google-fonts/momo-trust-display";
import {
  MomoTrustSans_400Regular,
  MomoTrustSans_500Medium,
  MomoTrustSans_700Bold,
} from "@expo-google-fonts/momo-trust-sans";
import { Session } from "@supabase/supabase-js";
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

  const [session, setSession] = useState<Session | null>(null);
  // True once the stored session has been read (it can be null = logged out)
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);
  // Onboarding status for a specific user, so a stale value is never used for a new session
  const [profile, setProfile] = useState<{
    userId: string;
    isOnboarded: boolean;
    failed?: boolean;
  } | null>(null);
  // Changes when user presses "Försök igen" (Try again) so the fetch retries
  const [retryCount, setRetryCount] = useState(0);

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
        setProfile(null);
        // Resets onboarding to not affect next user.
        // Will be read from Supabase next time
        useOnboardingStore.getState().reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get onboarding status when the logged in user changes
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;

    supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.log("Profile error:", error);
          setProfile({ userId, isOnboarded: false, failed: true });
          return;
        }
        setProfile({
          userId,
          isOnboarded: !!data?.onboarding_completed_at,
        });
      });
  }, [userId, retryCount]);

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
          <Button
            onPress={() => {
              setProfile(null);
              setRetryCount((c) => c + 1);
            }}
          >
            <Text>Försök igen</Text>
          </Button>
          <Button variant="link" onPress={() => supabase.auth.signOut()}>
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
