import { TAB_BAR_HEIGHT } from "@/constants/layout";
import { BlurView } from "expo-blur";
import { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs/index";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./ui/text";

const ACTIVE_COLOR = "hsl(27, 39%, 95%)";
const INACTIVE_COLOR = "#293907";

export default function TabsNavigation({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={90}
      tint="systemChromeMaterial"
      style={{
        position: "absolute",
        bottom: Math.max(insets.bottom, 10),
        left: 10,
        right: 10,
        borderRadius: 100,
      }}
    >
      <View
        role="tablist"
        style={{ height: TAB_BAR_HEIGHT }}
        className="flex-row items-center"
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // Skip tabs hidden via href: null
          const itemStyle = StyleSheet.flatten(options.tabBarItemStyle);
          if (itemStyle?.display === "none") return null;

          const label = options.title ?? route.name;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          const onPress = () => {
            const event = emitter.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
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
              className={`flex-1 h-[90%] m-1 items-center justify-center gap-1 rounded-full ${isFocused ? "bg-secondary/80" : ""}`}
            >
              {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
              <Text style={{ color }} className={`text-xs`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BlurView>
  );
}
