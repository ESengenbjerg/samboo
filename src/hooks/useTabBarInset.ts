import { TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from "@/constants/layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Distance from the screen bottom to the top edge of the floating tab bar. */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, TAB_BAR_MARGIN) + TAB_BAR_HEIGHT;
}
