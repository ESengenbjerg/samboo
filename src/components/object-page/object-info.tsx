import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { isPropertyType } from "@/constants/filter-options";
import { capitalize } from "@/utils/capitalize-string";
import { formatNumber } from "@shared/format";
import { PROPERTY_TYPE_LABELS } from "@shared/property-types";
import { View } from "react-native";
import { OBJECT_INFO, type ObjectInfoType } from "./object-info-config";

type ObjectInfoProps = {
  type: ObjectInfoType;
  value?: string | number | null;
};

export default function ObjectInfo({ type, value }: ObjectInfoProps) {
  if (value == null) return null;

  // property_type is the only text value: "lagenhet" -> "Lägenhet", not "Lagenhet"
  const text =
    typeof value === "string"
      ? isPropertyType(value)
        ? PROPERTY_TYPE_LABELS[value]
        : capitalize(value)
      : formatNumber(value);

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
