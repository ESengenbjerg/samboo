import { capitalize } from "@/utils/capitalize-string";
import { X } from "lucide-react-native";
import { View } from "react-native";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

type TagProps = {
  isNewConstruction?: boolean;
  text?: string;
  removable?: boolean;
};

export default function Tag({
  isNewConstruction,
  text,
  removable,
}: TagProps) {
  return (
    <>
      <View className="px-3 py-1 min-w-12 flex-row gap-1 items-center rounded-sm bg-secondary">
        <Text className="text-secondary-foreground">
          {isNewConstruction ? "Nyproduktion" : capitalize(text ?? "")}
        </Text>
        {removable && <Icon as={X} className="text-secondary-foreground" />}
      </View>
    </>
  );
}
