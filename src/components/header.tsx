import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Bell, UserCircle2 } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/icon"

export default function Header() {
    const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top }} className="flex-row justify-between items-center px-4 pb-8">
      <Link href="/(tabs)/search" asChild>
      <Pressable role="link" aria-label="Start">
        <Image
          source={require("@/assets/logos/logo-g-primary.svg")}
          style={{ width: 90, height: 40}}
          contentFit="contain"
          />
          </Pressable>
      </Link>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => router.push("/(tabs)/settings")}
          hitSlop={12}
          role="button"
          aria-label="Din profil"
        >
          <Icon as={UserCircle2} size={24} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/notifications")}
          hitSlop={12}
          role="button"
          aria-label="Notiser"
        >
          <Icon as={Bell} size={24}/>
        </Pressable>
      </View>
    </View>
  );
}
