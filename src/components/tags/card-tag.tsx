import { View } from "react-native";
import { Text } from "../ui/text";

type TagProps = {
  isNew?: boolean;
  isNewConstruction?: boolean;
  isNewList?: boolean;
};

export default function CardTag({
  isNew,
  isNewConstruction,
  isNewList,
}: TagProps) {
  if (!isNew && !isNewConstruction && !isNewList) return null;

  return (
    <View className="absolute top-0 right-3 flex-row gap-1">
      <View className="px-3 py-1 min-w-12 items-center rounded-sm bg-primary rounded-t-none">
        {isNew && <Text variant="small">Ny</Text>}
        {isNewConstruction && <Text variant="small">Nyproduktion</Text>}
        {isNewList && <Text variant="small">Nya objekt!</Text>}
      </View>
    </View>
  );
}
