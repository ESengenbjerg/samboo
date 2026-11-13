import { TAB_BAR_HEIGHT, TAB_BAR_MARGIN } from "@/constants/layout";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs/index";
import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./ui/text";

const ACTIVE_COLOR = "hsl(27, 39%, 95%)";
const INACTIVE_COLOR = "#293907";
const BORDER_COLOR = "rgba(41, 57, 7, 0.12)";

// Must match the pill geometry on the Pressable: h-[90%] + m-1 (4px)
const PILL_HEIGHT = TAB_BAR_HEIGHT * 0.9;
const PILL_MARGIN = 4;

export default function TabsNavigation({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  const hasPlacedIndicator = useRef(false);

  // Skip tabs hidden via href: null / display: none
  const visibleRoutes = state.routes.filter((route) => {
    const itemStyle = StyleSheet.flatten(
      descriptors[route.key].options.tabBarItemStyle,
    );
    return itemStyle?.display !== "none";
  });
  const focusedKey = state.routes[state.index]?.key;
  const activeIndex = visibleRoutes.findIndex((r) => r.key === focusedKey);
  const tabWidth =
    visibleRoutes.length > 0 ? barWidth / visibleRoutes.length : 0;

  useEffect(() => {
    if (tabWidth === 0) return;
    indicatorOpacity.value = withTiming(activeIndex >= 0 ? 1 : 0, {
      duration: 150,
    });
    if (activeIndex < 0) return;
    const target = activeIndex * tabWidth;
    if (!hasPlacedIndicator.current) {
      // First layout: place directly, don't animate in from the left edge
      indicatorX.value = target;
      hasPlacedIndicator.current = true;
    } else {
      indicatorX.value = withSpring(target, {
        damping: 40,
        stiffness: 300,
        mass: 0.8,
      });
    }
  }, [activeIndex, tabWidth, indicatorX, indicatorOpacity]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    opacity: indicatorOpacity.value,
  }));

  const onLayout = (e: LayoutChangeEvent) =>
    setBarWidth(e.nativeEvent.layout.width);

  return (
    <BlurView
      intensity={90}
      tint="systemChromeMaterial"
      style={{
        position: "absolute",
        bottom: Math.max(insets.bottom, TAB_BAR_MARGIN),
        left: TAB_BAR_MARGIN,
        right: TAB_BAR_MARGIN,
        borderRadius: 100,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: BORDER_COLOR,
      }}
    >
      <View
        role="tablist"
        onLayout={onLayout}
        style={{ height: TAB_BAR_HEIGHT }}
        className="flex-row items-center"
      >
        {/* Sliding active pill. Styled via style, not className: NativeWind is
            not reliably applied to Reanimated's Animated.View */}
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: PILL_MARGIN,
                top: (TAB_BAR_HEIGHT - PILL_HEIGHT) / 2,
                width: tabWidth - PILL_MARGIN * 2,
                height: PILL_HEIGHT,
              },
              indicatorStyle,
            ]}
          >
            <View className="flex-1 rounded-full bg-secondary/80" />
          </Animated.View>
        )}

        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = route.key === focusedKey;

          const label = options.title ?? route.name;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          const onPress = () => {
            const event = emitter.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigateToTab(route.key);
            }
          };

          const onLongPress = () => {
            emitter.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              role="tab"
              aria-selected={isFocused}
              aria-label={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarButtonTestID}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              className="flex-1 h-[90%] m-1 items-center justify-center gap-1 rounded-full"
            >
              {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
              <Text style={{ color }} className="text-xs">
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BlurView>
  );
}
