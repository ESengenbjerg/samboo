import { Text } from "@/components/ui/text";
import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { useToastStore } from "@/stores/toast";
import { useEffect } from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VISIBLE_MS = 5000;

const styles = {
  info: { container: "bg-muted", text: "text-foreground" },
  success: {
    container: "bg-muted-foreground",
    text: "text-secondary-foreground",
  },
  error: { container: "bg-destructive", text: "text-secondary-foreground" },
};

// Mount once in the root layout. Shows the latest message from useToastStore.
export function Toast() {
  const message = useToastStore((s) => s.message);
  const variant = useToastStore((s) => s.variant);
  const id = useToastStore((s) => s.id);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    // Native screen readers don't reliably read a view that appears, so announce it.
    // Does nothing on web, where role="alert" does the job
    AccessibilityInfo.announceForAccessibility(message);
    const timer = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, id, hide]);

  if (!message) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 8 }}
      className="absolute inset-x-0 items-stretch px-4"
    >
      <Pressable
        onPress={hide}
        role="alert"
        // Errors interrupt the screen reader, other messages wait their turn
        aria-live={variant === "error" ? "assertive" : "polite"}
        accessibilityHint="Tryck för att stänga"
        className={`rounded-sm px-6 py-3 ${styles[variant].container}`}
      >
        <Text className={`text-center ${styles[variant].text}`}>{message}</Text>
      </Pressable>
    </View>
  );
}
