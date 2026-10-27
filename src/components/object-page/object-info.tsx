import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { capitalize } from "@/utils/capitalize-string";
import { View } from "react-native";
import { OBJECT_INFO, type ObjectInfoType } from "./object-info-config";

type ObjectInfoProps = {
  type: ObjectInfoType;
  value?: string | number | null;
};

export default function ObjectInfo({ type, value }: ObjectInfoProps) {
  if (value == null) return null;

  const text =
    typeof value === "string"
      ? capitalize(value)
      : value.toLocaleString("sv-SE");

  const { icon, title, suffix } = OBJECT_INFO[type];

  return (
    <View className="flex-row justify-between items-center">
      <View className="flex-row items-center gap-2">
        <Icon as={icon} size={18} />
        <Text variant="bold">{title}</Text>
      </View>
      <Text>
        {text}
        {suffix}
      </Text>
    </View>
  );
}
