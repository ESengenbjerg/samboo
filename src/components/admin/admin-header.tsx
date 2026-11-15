import { Image } from "expo-image";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SignOutMenu from "../sign-out-menu";

// Header for the admin view: same look as Header, but without notifications, privacy info and the link to the search tab
export default function AdminHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="flex-row justify-between items-center px-4 pb-8 bg-background"
    >
      <Image
        source={require("@/assets/logos/logo-g-primary.svg")}
        style={{ width: 90, height: 40 }}
        contentFit="contain"
        accessibilityLabel="Samboo"
      />
      <SignOutMenu />
    </View>
  );
}
