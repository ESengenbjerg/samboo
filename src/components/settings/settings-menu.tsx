import { capitalize } from "@/utils/capitalize-string";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

type SettingsMenuProps = {
  title: string[];
  onSelect: (key: string) => void;
};

export default function SettingsMenu({ title, onSelect }: SettingsMenuProps) {
  return (
    <View className="flex-row flex-wrap gap-2" accessibilityRole="menu">
      {title.map((t) => (
        <Button
          key={t}
          variant="outline"
          onPress={() => onSelect(t)}
          aria-label={`Gå till ${t}`}
          className="flex-none shrink-0"
        >
          <Text className="text-nowrap">{capitalize(t)}</Text>
        </Button>
      ))}
    </View>
  );
}
