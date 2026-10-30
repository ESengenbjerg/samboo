import { Icon } from "@/components/ui/icon";
import { signOut } from "@/services/auth";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Bell, LogOut } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Text } from "./ui/text";

export default function Header() {
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 0,
    right: 4,
  };

  return (
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
          onPress={() => router.push("/(tabs)/notifications")}
          hitSlop={12}
          role="button"
          aria-label="Notiser"
        >
          <Icon as={Bell} size={24} />
        </Pressable>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Pressable hitSlop={12} role="button" aria-label="Din profil">
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
  );
}
