import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Card } from "../ui/card";
import { Text } from "../ui/text";

const fallbackImage = require("@/assets/images/no-image.jpg");

type ListButtonProps = {
  title: string;
  listId: string;
  numberOfSavedObjects: number;
  firstObjectImage: string | undefined;
};

export default function ListButton({
  title,
  listId,
  numberOfSavedObjects,
  firstObjectImage,
}: ListButtonProps) {
  function onPress() {
    router.push({
      pathname: "/saved/[listId]",
      params: { listId },
    });
  }

  return (
    <Pressable onPress={() => onPress()}>
      <Card className="p-0 border-none">
        <View className="flex-row justify-between">
          <View className="w-[40%]">
            <Image
              source={
                firstObjectImage ? { uri: firstObjectImage } : fallbackImage
              }
              style={{
                width: "100%",
                height: "100%",
                borderTopLeftRadius: "5px",
                borderBottomLeftRadius: "5px",
              }}
              contentFit="cover"
            />
          </View>
          <View className="flex-1 px-6 py-8 items-start">
            <Text variant="bold">{title} lista</Text>
            <Text>{numberOfSavedObjects} sparade objekt</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
