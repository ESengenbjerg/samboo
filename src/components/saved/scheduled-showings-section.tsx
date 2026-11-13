import ScheduledShowingInfo from "@/components/saved/scheduled-showing-info";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useShowings } from "@/hooks/showings/useShowings";
import { ScheduledShowing } from "@/types/showings";
import { formatDateLabel, toIsoDate } from "@/utils/date-format";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import FormMessage from "../form-message";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

type Feedback = { type: "success" | "error"; text: string };

export default function ScheduledShowingsSection({
  userId,
  onScrollToFeedback,
}: {
  userId: string;
  onScrollToFeedback?: () => void;
}) {
  const { showings, isLoading, error, removeShowing, refetch } = useShowings(
    userId,
    "upcoming",
  );
  const {
    showings: pastShowings,
    error: pastError,
    removeShowing: removePastShowing,
    refetch: refetchPast,
  } = useShowings(userId, "past");

  const [isInPast, setIsInPast] = useState(false);
  // If the last past showing is deleted or edited into the future there is nothing
  // left to show in the past list, and the user should be sent back to upcoming.
  if (isInPast && pastShowings.length === 0) {
    setIsInPast(false);
  }
  const displayedShowings = isInPast ? pastShowings : showings;
  const listError = isInPast ? pastError : error;

  // Message about the last edit or delete. Lives here and not on each showing,
  // since a deleted showing disappears and an edited showing can be used to other list.
  // Hidden when the user starts the next action.
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function clearFeedback() {
    setFeedback(null);
  }

  // Hide the message when the user leaves the screen, e.g. opens a list or
  // switches tab. The screen stays mounted, so the message would still be
  // there when the user comes back. The cleanup function runs when focus is lost
  useFocusEffect(
    useCallback(() => {
      return () => setFeedback(null);
    }, []),
  );

  // An edited showing can move between upcoming and past, so reload both
  function onShowingUpdated() {
    refetch();
    refetchPast();
    setFeedback({ type: "success", text: "Visningen är uppdaterad." });
  }

  function onShowingDeleted(id: number) {
    if (isInPast) {
      removePastShowing(id);
    } else {
      removeShowing(id);
    }
    setFeedback({ type: "success", text: "Visningen är raderad." });
  }

  function onShowingDeleteFailed() {
    setFeedback({
      type: "error",
      text: "Kunde inte radera visningen. Försök igen.",
    });
    // The message is at the top of the section, the user may have scrolled past it
    onScrollToFeedback?.();
  }

  function toggleList() {
    clearFeedback();
    setIsInPast(!isInPast);
  }

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
        <Text variant="h2">
          {isInPast ? "Tidigare visningar" : "Bokade visningar"}
        </Text>
        <Button variant="link" onPress={toggleList}>
          <Text>
            {pastShowings.length !== 0
              ? isInPast
                ? "Kommande"
                : "Tidigare"
              : null}
          </Text>
        </Button>
      </View>

      {/* A success message is hidden if the list could not be loaded, so the two don't contradict each other */}
      {feedback && !(feedback.type === "success" && listError) && (
        <View className="mb-4">
          {feedback.type === "error" ? (
            <FormError>{feedback.text}</FormError>
          ) : (
            <FormMessage>{feedback.text}</FormMessage>
          )}
        </View>
      )}

      {isLoading && <Spinner size="large" />}
      {listError && <FormError>{listError}</FormError>}
      {!isLoading && !listError && displayedShowings.length === 0 && (
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
                  onDeleted={() => onShowingDeleted(s.id)}
                  onUpdated={onShowingUpdated}
                  onDeleteFailed={onShowingDeleteFailed}
                  onStartAction={clearFeedback}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
