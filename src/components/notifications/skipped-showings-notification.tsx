// Shown after accepting an invite, and the group already has
// a showing for the same listing. The group version won, and mine was lost.
// This component notifies the user instead of losing it silently

import { SkippedShowing } from "@/types/showings";
import { formatShowingWhen } from "@/utils/date-format";
import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Text } from "../ui/text";

export default function SkippedShowingNotification({
  showings,
}: {
  showings: SkippedShowing[];
}) {
  if (showings.length === 0) return null;

  return (
    <>
      <Separator />
      <View className="gap-2">
        <Text variant="bold">
          {showings.length === 1
            ? "En av dina visningar följde inte med."
            : `${showings.length} av dina visningar följde inte med.`}
        </Text>
        <Text>
          Gruppen hade redan en visning på samma bostad, så gruppens visning
          gäller.
        </Text>
        {showings.map((s) => (
          <View
            key={`${s.url}-${s.showing_date}`}
            className="flex-row justify-between"
          >
            <View className="flex-1">
              <Text variant="bold">{s.address ?? "Bostad"}</Text>
              <Text>{formatShowingWhen(s.showing_date, s.start_time)}</Text>
            </View>
            <Button
              size="sm"
              variant="destructive"
              onPress={() => router.push("/(tabs)/saved")}
              className="mt-4 ml-4 max-h-11"
            >
              <Text>Till visningar</Text>
            </Button>
          </View>
        ))}
      </View>
    </>
  );
}
