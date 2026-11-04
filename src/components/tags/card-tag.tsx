import { View } from "react-native";
import { Text } from "../ui/text";

type TagProps = {
  isNew?: boolean;
  isNewConstruction?: boolean;
};

export default function CardTag({ isNew, isNewConstruction }: TagProps) {
  return (
    <>
      <View className="absolute top-0 right-4 px-3 py-1 min-w-12 items-center rounded-sm bg-primary rounded-t-none">
        <Text variant="small">{isNew ? "Ny" : "Nyproduktion"}</Text>
      </View>
    </>
  );
}
