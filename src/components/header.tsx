import { Icon } from "@/components/ui/icon";
import { useNotificationDot } from "@/hooks/useNotificationDot";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Bell, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrivacyDialog } from "./modals/privacy-dialog";
import SignOutMenu from "./sign-out-menu";

export default function Header() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { showDot } = useNotificationDot();

  return (
    <>
      <View
        style={{ paddingTop: insets.top }}
        className="flex-row justify-between items-center px-4 pb-8 bg-background"
      >
        <Link href="/(tabs)/search" asChild>
          <Pressable role="link" aria-label="Start">
            <Image
              source={require("@/assets/logos/logo-g-primary.svg")}
              style={{ width: 90, height: 40 }}
              contentFit="contain"
            />
          </Pressable>
        </Link>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setPrivacyOpen(true)}
            hitSlop={12}
            role="button"
            aria-label="Personuppgifter"
          >
            <Icon as={ShieldCheck} size={24} />
          </Pressable>

           <Pressable
            onPress={() => router.push("/(tabs)/notifications")}
            hitSlop={12}
            role="button"
            aria-label={showDot ? "Notiser, nya händelser" : "Notiser"}
          >
            <View>
              <Icon as={Bell} size={24} />
              {showDot && (
                <View className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-destructive" />
              )}
            </View>
          </Pressable>
          <SignOutMenu />
        </View>
      </View>
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </>
  );
}
