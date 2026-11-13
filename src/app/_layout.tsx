import "../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";

import { useEffect } from "react";

import AdminHeader from "@/components/admin/admin-header";
import Header from "@/components/header";
import { Toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useIsAdmin } from "@/hooks/admin/useIsAdmin";
import { useSession } from "@/hooks/auth/useSession";
import { useVerifySession } from "@/hooks/auth/useVerifySession";
import { useLikesSync } from "@/hooks/useLikes";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { signOut } from "@/services/auth";
import { useOnboardingStore } from "@/stores/onboarding";
import { usePasswordRecoveryStore } from "@/stores/password-recovery";
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

  // TODO: Add colorScheme if implementation of light/dark mode is relevant (on could)
  // const { colorScheme } = useColorScheme();

  const { session, isSessionLoaded } = useSession();
  useVerifySession();
  const userId = session?.user.id;
  useLikesSync(userId);

  const { status: profile, retry: retryProfile } = useOnboardingStatus(userId);
  const onboardingComplete = useOnboardingStore((s) => s.onboardingComplete);
  const { status: admin, retry: retryAdmin } = useIsAdmin(userId);

  // During a password reset the user has a session, but must stay in (auth) to set a new password
  const isRecoveringPassword = usePasswordRecoveryStore((s) => s.isRecovering);
  const isLoggedIn = !!session && !isRecoveringPassword;
  const isOnboarded = (profile?.isOnboarded ?? false) || onboardingComplete;
  // An admin only sees the admin view: no onboarding and no tabs
  const isAdmin = isLoggedIn && (admin?.isAdmin ?? false);
  const isProfileLoading = isLoggedIn && profile?.userId !== userId;
  const isAdminLoading = isLoggedIn && admin?.userId !== userId;
  const isReady =
    fontsLoaded && isSessionLoaded && !isProfileLoading && !isAdminLoading;

  // Leave start screen when everything is loaded
  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  // Explicit targets: without them the redirect lands on the bare group URL, e.g. "/(auth)", which doesn't match a route
  const homeHref = isAdmin
    ? "/admin"
    : isLoggedIn && !isOnboarded
      ? "/(onboarding)/profile"
      : "/(tabs)/search";
  const loginHref = "/(auth)/login";

  if (!isReady) return null;

  // Without the admin status an admin could land in onboarding, so a failed fetch stops here too
  if (profile?.failed || admin?.failed) {
    return (
      // TODO: Add ThemeProvider if implementation of light/dark mode is relevant (on could)
      // <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}>

      <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
        <Text>Kunde inte hämta din profil.</Text>
        {/* "Försök igen" (Try again) refetches the profile */}
        <Button
          onPress={() => {
            if (profile?.failed) retryProfile();
            if (admin?.failed) retryAdmin();
          }}
        >
          <Text>Försök igen</Text>
        </Button>
        <Button variant="link" onPress={() => signOut()}>
          <Text>Logga ut</Text>
        </Button>
      </View>
      // </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* TODO: Add ThemeProvider if implementation of light/dark mode is relevant (on could) */}
      {/* <ThemeProvider value={NAV_THEME[colorScheme ?? "light"]}> */}

      {/* Redirects user to correct view */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isLoggedIn} redirectTo={homeHref}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected
          guard={isLoggedIn && !isOnboarded && !isAdmin}
          redirectTo={isLoggedIn ? homeHref : loginHref}
        >
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected
          guard={isAdmin}
          redirectTo={isLoggedIn ? homeHref : loginHref}
        >
          <Stack.Screen
            name="admin"
            options={{ headerShown: true, header: () => <AdminHeader /> }}
          />
        </Stack.Protected>
        <Stack.Protected
          guard={isLoggedIn && isOnboarded && !isAdmin}
          redirectTo={isLoggedIn ? homeHref : loginHref}
        >
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: true, header: () => <Header /> }}
          />
        </Stack.Protected>
      </Stack>
      <PortalHost />
      <Toast />
      {/* </ThemeProvider> */}
    </GestureHandlerRootView>
  );
}
