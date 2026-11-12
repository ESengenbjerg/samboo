import FormError from "@/components/form-error";
import AnsweredInviteNotification from "@/components/notifications/answered-invitation-notification";
import { default as FeedUpdateNotification } from "@/components/notifications/feed-update-notification";
import GroupUpdateNotification from "@/components/notifications/group-update-notification";
import InvitationNotification from "@/components/notifications/invitation-notification";
import ShowingUpdateNotification from "@/components/notifications/showing-update-notification";
import SkippedShowingNotification from "@/components/notifications/skipped-showings-notification";
import { Text } from "@/components/ui/text";
import { useSession } from "@/hooks/auth/useSession";
import { useAnsweredInvites } from "@/hooks/useAnsweredInvites";
import { useAnswerInvite } from "@/hooks/useAnswerInvite";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useGroupUpdates } from "@/hooks/useGroupUpdates";
import { useMarkNotificationsSeen } from "@/hooks/useMarkNotificationsSeen";
import { useNewListingIds } from "@/hooks/useNewListingIds";
import { useNewMatchesCount } from "@/hooks/useNewMatchesCount";
import { useShowingEvents } from "@/hooks/showings/useShowingEvents";
import { NotificationDay } from "@/types/notifications";
import { useFocusEffect } from "expo-router";
import { Fragment, ReactNode, useCallback } from "react";
import { ScrollView, View } from "react-native";

// One notification in a day section, with the time it happend so the section can be sorted
type Item = { key: string; time: number; node: ReactNode };

// Null (no timestamp) counts as oldest
function toTime(timestamp: string | null) {
  return timestamp ? new Date(timestamp).getTime() : 0;
}

// Newest notification first
function Items({ items }: { items: Item[] }) {
  return [...items]
    .sort((a, b) => b.time - a.time)
    .map((i) => <Fragment key={i.key}>{i.node}</Fragment>);
}

export default function NotificationsScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const accounts = useConnectedAccounts(userId);

  // Refetches by itself every time the page is opened
  const {
    newMatchesCount,
    error: newMatchesCountError,
    isLoading: newMatchesCountIsLoading,
    isReady: newMatchesCountIsReady,
  } = useNewMatchesCount(userId);
  const {
    newListingIds,
    error: newListingIdsError,
    isLoading: newListingIdsIsLoading,
    isReady: newListingIdsIsReady,
  } = useNewListingIds(session?.user.id);
  const {
    updatesByDay,
    error: updatesByDayError,
    isLoading: updatesByDayIsLoading,
    isReady: updatesByDayIsReady,
  } = useGroupUpdates(userId, newListingIds);
  const {
    eventsByDay,
    error: eventsByDayError,
    isLoading: eventsByDayIsLoading,
    isReady: eventsByDayIsReady,
  } = useShowingEvents(userId);
  const { answeredByDay } = useAnsweredInvites(accounts);
  // Lives here, not in InvitationNotification: that component unmounts when the last
  // invite is answered and the confirmation would be lost
  const answer = useAnswerInvite(accounts);

  const displayError =
    accounts.error ||
    accounts.actionError ||
    newMatchesCountError ||
    newListingIdsError ||
    updatesByDayError ||
    eventsByDayError;

  const isBusy =
    accounts.isLoading ||
    newMatchesCountIsLoading ||
    newListingIdsIsLoading ||
    updatesByDayIsLoading ||
    eventsByDayIsLoading;

  // Every source has loaded this visit and none has failed. Otherwise the user
  // has not seen all notifications yet, so the dot must stay
  const allReady =
    accounts.isReady &&
    newMatchesCountIsReady &&
    newListingIdsIsReady &&
    updatesByDayIsReady &&
    eventsByDayIsReady;

  // Turns off the dot on the bell, that indicate new notifications,
  // when the user leaves the page
  useMarkNotificationsSeen(allReady);

  // Reload invites every time the page is opened. The confirmation of an answered invite,
  // the notice about lost showings and an old error are only relevant for the visit
  // they happened in, so they are cleared on leave
  const { refresh, clearSkippedShowings, clearActionError } = accounts;
  const { clearAnswer } = answer;
  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => {
        clearSkippedShowings();
        clearActionError();
        clearAnswer();
      };
    }, [refresh, clearSkippedShowings, clearActionError, clearAnswer]),
  );

  const hasToday =
    accounts.receivedInvites.length > 0 ||
    accounts.skippedShowings.length > 0 ||
    answer.answeredInvite != null ||
    newMatchesCount > 0 ||
    updatesByDay.today.length > 0 ||
    answeredByDay.today.length > 0 ||
    eventsByDay.today.length > 0;
  const hasYesterday =
    updatesByDay.yesterday.length > 0 ||
    answeredByDay.yesterday.length > 0 ||
    eventsByDay.yesterday.length > 0;
  const hasEarlier =
    updatesByDay.earlier.length > 0 ||
    answeredByDay.earlier.length > 0 ||
    eventsByDay.earlier.length > 0;
  const isEmpty = !hasToday && !hasYesterday && !hasEarlier;

  // Sort notifications in lists separated by day
  function itemsFor(day: NotificationDay): Item[] {
    const items: Item[] = [];

    for (const e of eventsByDay[day]) {
      items.push({
        key: `showing-${e.id}`,
        time: toTime(e.created_at),
        node: <ShowingUpdateNotification event={e} />,
      });
    }
    for (const i of answeredByDay[day]) {
      items.push({
        key: `answered-${i.id}`,
        time: toTime(i.responded_at),
        node: <AnsweredInviteNotification invite={i} />,
      });
    }
    for (const u of updatesByDay[day]) {
      items.push({
        key: `member-${u.member.id}`,
        time: toTime(u.latestLikedAt),
        node: (
          <GroupUpdateNotification
            memberId={u.member.id}
            memberName={u.member.name}
            newCount={u.newCount}
          />
        ),
      });
    }
    if (day === "today") {
      // Always rendered: Keeps confirmation after answering the last invite.
      const inviteTimes = accounts.receivedInvites.map((i) =>
        toTime(i.created_at),
      );
      items.push({
        key: "invites",
        time:
          inviteTimes.length > 0
            ? Math.max(...inviteTimes)
            : Number.MAX_SAFE_INTEGER,
        node: <InvitationNotification accounts={accounts} answer={answer} />,
      });
      // "Now": shown right after accepting an invite
      items.push({
        key: "skipped-showings",
        time: Number.MAX_SAFE_INTEGER,
        node: (
          <SkippedShowingNotification showings={accounts.skippedShowings} />
        ),
      });
      // A count with no time: Last in the section
      items.push({
        key: "feed",
        time: 0,
        node: <FeedUpdateNotification newObjects={newMatchesCount} />,
      });
    }
    return items;
  }

  return (
    <View className="flex-1 px-6 bg-background gap-2">
      <Text variant="h1" className="pb-4">
        Nya händelser
      </Text>

      {displayError && <FormError>{displayError}</FormError>}

      <ScrollView
        className="bg-background"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        {isBusy && <Text>Laddar...</Text>}
        {!isBusy && !displayError && isEmpty && <Text>Inga nya händelser</Text>}
        {!isEmpty && (
          <View className="gap-2">
            {hasToday && (
              <>
                <Text variant="h3" className="pt-4">
                  Idag
                </Text>
                <View className="gap-6">
                  <Items items={itemsFor("today")} />
                </View>
              </>
            )}

            {hasYesterday && (
              <>
                <Text variant="h3" className="pt-8">
                  Igår
                </Text>
                <View className="gap-6">
                  <Items items={itemsFor("yesterday")} />
                </View>
              </>
            )}

            {hasEarlier && (
              <>
                <Text variant="h3" className="pt-8">
                  Tidigare
                </Text>
                <View className="gap-6">
                  <Items items={itemsFor("earlier")} />
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
