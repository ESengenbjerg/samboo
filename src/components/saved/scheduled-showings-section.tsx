import ScheduledShowingInfo from "@/components/saved/scheduled-showing-info";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";

import { useShowings } from "@/hooks/useShowings";
import { ScheduledShowing } from "@/types/showings";
import { formatDateLabel, toIsoDate } from "@/utils/date-format";
import { useState } from "react";
import { View } from "react-native";
import { Button } from "../ui/button";

export default function ScheduledShowingsSection({
  userId,
}: {
  userId: string;
}) {
  const { showings, isLoading, error, removeShowing, refetch } = useShowings(
    userId,
    "upcoming",
  );
  const {
    showings: pastShowings,
    removeShowing: removePastShowing,
    refetch: refetchPast,
  } = useShowings(userId, "past");

  // An edited showing can move between upcoming and past, so reload both
  function reloadShowings() {
    refetch();
    refetchPast();
  }

  const [isInPast, setIsInPast] = useState(false);
  const displayedShowings = isInPast ? pastShowings : showings;

  // Find out if the showing is the first for that date,
  // to know when to add the date as heading
  function isFirstForDate(showing: ScheduledShowing, index: number) {
    return (
      index === 0 ||
      toIsoDate(showing.startsAt) !==
        toIsoDate(displayedShowings[index - 1].startsAt)
    );
  }

  return (
    <View>
      <View className="flex-row items-end justify-between mb-4">
        <Text variant="h2">{isInPast ? "Tidigare visningar" : "Bokade visningar"}</Text>
        <Button variant="link" onPress={() => setIsInPast(!isInPast)}>
          <Text>{pastShowings.length !== 0 ? (
            isInPast ? "Kommande" : "Tidigare"
          ) : null}</Text>
        </Button>
      </View>

      {isLoading && <Text>Laddar visningar...</Text>}
      {error && <Text>{error}</Text>}
      {!isLoading && !error && displayedShowings.length === 0 && (
        <Text>Inga bokade visningar</Text>
      )}

      <View>
        {displayedShowings.map((s, index) => {
          return (
            <View key={s.id} className="gap-2">
              {isFirstForDate(s, index) ? (
                <>
                  <Text variant="bold" className={index > 0 ? "mt-8" : ""}>
                    {formatDateLabel(s.startsAt)}
                  </Text>
                  <Separator className="mb-4" />
                </>
              ) : (
                <Separator className="mb-4" />
              )}

              <View className="mb-4">
                <ScheduledShowingInfo
                  id={s.id}
                  listingId={s.listingId}
                  address={s.address}
                  municipality={s.municipality}
                  area={s.area}
                  startsAt={s.startsAt}
                  note={s.note}
                  onDeleted={() =>
                    isInPast ? removePastShowing(s.id) : removeShowing(s.id)
                  }
                  onUpdated={reloadShowings}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
