import { Text } from "@/components/ui/text";
import { View } from "react-native";

// One label and value on a line in an admin card
export default function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text variant="muted">{label}</Text>
      <Text variant="small" className="shrink text-right">
        {value}
      </Text>
    </View>
  );
}
