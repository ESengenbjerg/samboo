import { THEME } from "@/lib/theme";
import { ActivityIndicator, ActivityIndicatorProps, useColorScheme } from "react-native";

export function Spinner(props: ActivityIndicatorProps) {
  const scheme = useColorScheme() ?? "light";

  return <ActivityIndicator color={THEME[scheme].foreground} {...props} />;
}
