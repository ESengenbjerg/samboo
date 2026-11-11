import { ArrowUp } from "lucide-react-native";
import { Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Icon } from "./ui/icon";

type BackToTopButtonProps = { onPress: () => void };

export default function BackToTopButton({ onPress }: BackToTopButtonProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      exiting={FadeOut.duration(350)}
      className="absolute right-1 bottom-6 z-10"
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
