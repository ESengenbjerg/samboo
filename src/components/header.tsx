import { Icon } from "@/components/ui/icon";
import { useNotificationDot } from "@/hooks/useNotificationDot";
import { signOut } from "@/services/auth";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Bell, LogOut, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrivacyDialog } from "./modals/privacy-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Text } from "./ui/text";

export default function Header() {
  const [isLoading, setIsLoading] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { showDot } = useNotificationDot();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 0,
    right: 4,
  };

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Pressable hitSlop={12} role="button" aria-label="Logga ut">
                <Icon as={LogOut} size={24} />
              </Pressable>
            </DropdownMenuTrigger>
            <DropdownMenuContent insets={contentInsets} align="end">
              <DropdownMenuItem
                onPress={async () => {
                  setIsLoading(true);
                  const { error } = await signOut();
                  if (error) setIsLoading(false);
                }}
              >
                <Text>{!isLoading ? "Logga ut" : "Loggar ut..."}</Text>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </View>
      </View>
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </>
  );
}
