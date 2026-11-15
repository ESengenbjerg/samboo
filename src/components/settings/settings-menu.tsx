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
    <View className="flex-row flex-wrap gap-2" role="navigation">
      {title.map((t, i) => (
        <Button
          key={t}
          variant="ghost"
          size="sm"
          onPress={() => onSelect(t)}
          aria-label={`Gå till ${t}`}
          className="flex-none shrink-0 p-0"
        >
          <Text className="text-nowrap">
            {/* No separator after the last item, so a row never ends with a dangling "|" */}
            {capitalize(t)}
            {i < title.length - 1 ? " |" : ""}
          </Text>
        </Button>
      ))}
    </View>
  );
}
