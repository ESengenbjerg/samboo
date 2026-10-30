import { ScheduledShowing } from "@/types/showings";
import { goToObject } from "@/utils/go-to-object";
import { googleMapsUrl } from "@/utils/google-maps-url";
import { Link } from "expo-router";
import { Clock, Globe, House, Map, NotebookPen } from "lucide-react-native";
import { Platform, View } from "react-native";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

export default function ScheduledShowingInfo(showing: ScheduledShowing) {
  const timeText = showing.startsAt.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View className="gap-2">
      <View className="flex-row justify-between items-center">
        {/* Address and area */}
        <View>
          <Button
            variant="link"
            onPress={() => goToObject(showing.listingId, "/saved/object/[id]")}
            className="self-start min-h-0 px-0 py-0 justify-start"
            style={Platform.select({
              web: { marginLeft: -12 },
              default: undefined,
            })}
          >
            <Icon as={House} className="size-[18px]" />
            <Text className="text-base" variant="bold">
              {showing.address}
            </Text>
          </Button>
          <View className="flex-row gap-2 items-center">
            <Icon as={Globe} size={18} />
            <Text>{showing.area}</Text>
          </View>
        </View>

        {/* Time and map */}
        <View>
          <View className="flex-row gap-2 items-center">
            <Icon as={Clock} size={18}></Icon>
            <Text>{timeText}</Text>
          </View>
          <View className="flex-row gap-2 items-center">
            <Icon as={Map} size={18}></Icon>
            <Link
              href={googleMapsUrl(
                showing.address,
                showing.area,
                showing.municipality,
              )}
            >
              <Text className="underline">Hitta hit</Text>
            </Link>
          </View>
        </View>
      </View>

      {/* TODO: Add edit action for showing date, time and note. */}
      {/* TODO: Add delete action with confirmation. */}

      {/* Note */}
      {showing.note?.trim() && (
        <View className="mb-4 mt-4">
          <View className="flex-row items-center gap-2">
            <Icon as={NotebookPen} size={18} />
            <Text variant="bold" className="justify-start">
              Anteckning
            </Text>
          </View>
          <Text className="text-base">{showing.note}</Text>
        </View>
      )}
    </View>
  );
}
