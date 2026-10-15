import { BlurView } from "expo-blur";
import { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./ui/text";

export default function TabsNavigation({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView style={{ paddingBottom: insets.bottom }}>
      <View className="h-20 flex-row items-center">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // Skip tabs hidden via href: null
          const itemStyle = StyleSheet.flatten(options.tabBarItemStyle);
          if (itemStyle?.display === "none") return null;

          const label = options.title ?? route.name;
          const color = "#293907";

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              role="tab"
              aria-selected={isFocused}
              aria-label={label}
              className={`flex-1 h-[90%] m-1 rounded items-center justify-center gap-1 ${isFocused ? "bg-sand" : ""}`}
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
