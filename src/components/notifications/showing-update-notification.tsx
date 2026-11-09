import { ShowingEvent } from "@/types/notifications";
import { parseIsoDate } from "@/utils/date-format";
import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

type ShowingUpdateNotificationProps = {
  event: ShowingEvent;
};

// "2026-11-12" + "17:30:00" -> "12 nov 17:30". Without the time if it is null
function formatWhen(date: string, time: string | null) {
  const day = parseIsoDate(date)
    .toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
    .replace(".", "");
  return time ? `${day} ${time.slice(0, 5)}` : day;
}

export default function ShowingUpdateNotification({
  event,
}: ShowingUpdateNotificationProps) {
  const where = event.address ?? "en bostad";
  const when = formatWhen(event.showing_date, event.start_time);

  let title: string;
  let text: string;

  switch (event.action) {
    case "created":
      title = "Ny visning";
      text = `${event.actor_name} lade till en visning: ${where}, ${when}`;
      break;
    case "updated":
      title = "Uppdaterad visning";
      text = `${event.actor_name} har redigerat visningen på ${where}`;
      break;
    case "deleted":
      title = "Raderad visning";
      text = `${event.actor_name} har raderat visningen på ${where}`;
      break;
  }

  return (
    <>
      <Separator />
      <View className="flex-row justify-between items-center gap-2">
        <View className="flex-1">
          <Text variant="bold">{title}</Text>
          <Text>{text}</Text>
        </View>

        {event.action !== "deleted" && (
          <Button
            size="sm"
            onPress={() => router.push("/(tabs)/saved")}
            className="max-h-7"
          >
            <Text>Till visningar</Text>
          </Button>
        )}
      </View>
    </>
  );
}
