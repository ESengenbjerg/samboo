import ScheduledShowing from "@/components/saved/scheduled-showing";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useShowings } from "@/hooks/useShowings";
import { formatDateLabel, toIsoDate } from "@/utils/date-format";
import { View } from "react-native";

export default function ScheduledShowingsSection({
  userId,
}: {
  userId: string;
}) {
  const { showings, isLoading, error } = useShowings(userId, "upcoming");

  return (
    <View>
      <View className="flex-row items-end justify-between mb-4">
        <Text variant="h2">Bokade visningar</Text>
        <Button variant="link">
          <Text>Tidigare visningar</Text>
        </Button>
      </View>

      {isLoading && <Text>Laddar visningar...</Text>}
      {error && <Text>{error}</Text>}
      {!isLoading && !error && showings.length === 0 && (
        <Text>Inga bokade visningar</Text>
      )}

      <View>
        {showings.map((s, index) => {
          const isFirstForDate =
            index === 0 ||
            toIsoDate(s.startsAt) !== toIsoDate(showings[index - 1].startsAt);

          return (
            <View key={s.id} className="gap-2">
              {isFirstForDate ? (
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
                <ScheduledShowing
                  id={s.id}
                  address={s.address}
                  municipality={s.municipality}
                  area={s.area}
                  startsAt={s.startsAt}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
