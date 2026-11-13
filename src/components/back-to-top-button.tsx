import { ArrowUp } from "lucide-react-native";
import { Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Icon } from "./ui/icon";
import { useTabBarInset } from "@/hooks/useTabBarInset";

type BackToTopButtonProps = { onPress: () => void };

export default function BackToTopButton({ onPress }: BackToTopButtonProps) {
  const tabBarInset = useTabBarInset();
  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      exiting={FadeOut.duration(350)}
      // Positioned with style, not className: NativeWind classes are not reliably
      // applied to Reanimated's Animated.View (on web the button ended up in the flow)
      style={{
        position: "absolute",
        right: 4,
        bottom: tabBarInset + 16,
        zIndex: 10,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Tillbaka till toppen"
        className="h-11 w-11 rounded bg-secondary items-center justify-center"
      >
        <Icon as={ArrowUp} size={24} className="text-secondary-foreground" />
      </Pressable>
    </Animated.View>
  );
}
