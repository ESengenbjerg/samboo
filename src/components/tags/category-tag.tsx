import { View } from "react-native";
import { Text } from "../ui/text";

type TagProps = {
  isNew?: boolean;
  isNewConstruction?: boolean;
};

export default function CategoryTag({ isNew, isNewConstruction }: TagProps) {
  return (
    <>
      <View className="px-3 py-1 min-w-12 items-center rounded-sm bg-primary">
        <Text variant="small">{isNew ? "Ny" : "Nyproduktion"}</Text>
      </View>
    </>
  );
}
