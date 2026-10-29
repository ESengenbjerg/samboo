import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Card } from "../ui/card";
import { Text } from "../ui/text";

const fallbackImage = require("@/assets/images/no-image.jpg");

type ListButtonProps = {
  title: string;
  listId: number | string;
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
      params: { listId, title: `${title} lista` },
    });
  }

  return (
    <Pressable onPress={() => onPress()}>
      <Card className="h-28 p-0 border-none overflow-hidden ">
        <View className="h-full flex-row justify-between">
          <View className="h-full w-[40%] rounded-l-md">
            <Image
              source={
                firstObjectImage ? { uri: firstObjectImage } : fallbackImage
              }
              style={{
                width: "100%",
                height: "100%",
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
