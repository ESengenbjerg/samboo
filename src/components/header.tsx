import { Icon } from "@/components/ui/icon";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Bell, UserCircle2 } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Text } from "./ui/text"
import { Button } from "./ui/button";
import { supabase } from "@/utils/supabase";
import { useState } from "react";

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
      className="flex-row justify-between items-center px-4 pb-8"
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Pressable
              hitSlop={12}
              role="button"
              aria-label="Din profil"
            >
              <Icon as={UserCircle2} size={24} />
            </Pressable>
          </DropdownMenuTrigger>
          <DropdownMenuContent insets={contentInsets} align="end">
            <DropdownMenuItem onPress={async () => {
                setIsLoading(true);
                const { error } = await supabase.auth.signOut();
                if (error) setIsLoading(false);
              }}>
              <Text>
                {!isLoading ? "Logga ut" : "Loggar ut..."}
              </Text>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Pressable
          onPress={() => router.push("/(tabs)/notifications")}
          hitSlop={12}
          role="button"
          aria-label="Notiser"
        >
          <Icon as={Bell} size={24} />
        </Pressable>
      </View>
    </View>
  );
}
