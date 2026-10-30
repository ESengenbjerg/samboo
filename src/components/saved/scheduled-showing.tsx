import { ScheduledShowings } from "@/types/showings";
import { capitalize } from "@/utils/capitalize-string";
import { googleMapsUrl } from "@/utils/google-maps-url";
import { Link } from "expo-router";
import { Clock, Map } from "lucide-react-native";
import { View } from "react-native";
import { Icon } from "../ui/icon";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

export default function ScheduledShowing(showings: ScheduledShowings) {

  const timeText = showings.startsAt.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View className="gap-2">

      <View className="flex-row justify-between items-center">
        <View>
          <Text variant="bold">{showings.address}</Text>
          <Text>{showings.area}</Text>
        </View>
        <View>
          <View className="flex-row gap-2 items-center">
            <Icon as={Clock}></Icon>
            <Text variant="bold">{timeText}</Text>
          </View>
          <View className="flex-row gap-2 items-center">
            <Icon as={Map}></Icon>
            <Link
              href={googleMapsUrl(
                showings.address,
                showings.area,
                showings.municipality,
              )}
            >
              <Text>Hitta hit</Text>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}
