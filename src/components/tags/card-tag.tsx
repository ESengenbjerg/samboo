import { View } from "react-native";
import { Text } from "../ui/text";

type TagProps = {
  isNew?: boolean;
  isNewConstruction?: boolean;
  isNewList?: boolean;
};

export default function CardTag({ isNew, isNewConstruction, isNewList }: TagProps) {
  if (!isNew && !isNewConstruction && !isNewList) return null;

  return (
    <View className="absolute top-0 right-4 flex-row gap-1">
      {isNew && (
        <View className="px-3 py-1 min-w-12 items-center rounded-sm bg-primary rounded-t-none">
          <Text variant="small">Ny</Text>
        </View>
      )}
      {isNewConstruction && (
        <View className="px-3 py-1 min-w-12 items-center rounded-sm bg-primary rounded-t-none">
          <Text variant="small">Nyproduktion</Text>
        </View>
      )}
      {isNewList && (
        <View className="px-3 py-1 min-w-12 items-center rounded-sm bg-primary rounded-t-none">
          <Text variant="small">Nya objekt!</Text>
        </View>
      )}
    </View>
  );
}
