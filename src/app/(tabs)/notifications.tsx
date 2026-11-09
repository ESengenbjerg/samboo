import AnsweredInviteNotification from "@/components/notifications/answered-invitation-notification";
import { default as FeedUpdateNotification } from "@/components/notifications/feed-update-notification";
import GroupUpdateNotification from "@/components/notifications/group-update-notification";
import InvitationNotification from "@/components/notifications/invitation-notification";
import ShowingUpdateNotification from "@/components/notifications/showing-update-notification";
import SkippedShowingNotification from "@/components/notifications/skipped-showings-notification";
import { Text } from "@/components/ui/text";
import { useAnsweredInvites } from "@/hooks/useAnsweredInvites";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useGroupUpdates } from "@/hooks/useGroupUpdates";
import { useMarkNotificationsSeen } from "@/hooks/useMarkNotificationsSeen";
import { useNewListingIds } from "@/hooks/useNewListingIds";
import { useNewMatchesCount } from "@/hooks/useNewMatchesCount";
import { useSession } from "@/hooks/useSession";
import { useShowingEvents } from "@/hooks/useShowingEvents";
import {
  AnsweredInvite,
  MemberUpdate,
  ShowingEvent,
} from "@/types/notifications";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ScrollView, View } from "react-native";

// One GroupUpdate per member with something new
function MemberUpdates({ updates }: { updates: MemberUpdate[] }) {
  return updates.map((u) => (
    <GroupUpdateNotification
      key={u.member.id}
      memberId={u.member.id}
      memberName={u.member.name}
      newCount={u.newCount}
    />
  ));
}

// One AnsweredInviteNotification per answered invtite
function AnsweredInvites({ invites }: { invites: AnsweredInvite[] }) {
  return invites.map((i) => (
    <AnsweredInviteNotification key={i.id} invite={i} />
  ));
}

// One ShowingUpdateNotification per change another member made to a showing
function ShowingEvents({ events }: { events: ShowingEvent[] }) {
  return events.map((e) => <ShowingUpdateNotification key={e.id} event={e} />);
}

export default function NotificationsScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const accounts = useConnectedAccounts(userId);

  // Refetches by itself every time the page is opened
  const { newMatchesCount } = useNewMatchesCount(userId);
  const { newListingIds } = useNewListingIds(session?.user.id);
  const { updatesByDay } = useGroupUpdates(userId, newListingIds);
  const { answeredByDay } = useAnsweredInvites(accounts);
  const { eventsByDay } = useShowingEvents(userId);

  // Turns off the dot on the bell, that indicate new notifications,
  // when the user leaves the page
  useMarkNotificationsSeen();

  // Reload invites every time the page is opened
  const { refresh } = accounts;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const hasToday =
    accounts.receivedInvites.length > 0 ||
    accounts.skippedShowings.length > 0 ||
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

  return (
    <View className="flex-1 px-6 bg-background gap-2">
      <Text variant="h1" className="pb-4">
        Nya händelser
      </Text>

      <ScrollView
        className="bg-background"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <Text>Inga nya händelser</Text>
        ) : (
          <View className="gap-2">
            {hasToday && (
              <>
                <Text variant="h3" className="pt-4">
                  Idag
                </Text>
                <View className="gap-6">
                  <InvitationNotification accounts={accounts} />
                  <SkippedShowingNotification
                    showings={accounts.skippedShowings}
                  />
                  <AnsweredInvites invites={answeredByDay.today} />
                  <FeedUpdateNotification newObjects={newMatchesCount} />
                  <ShowingEvents events={eventsByDay.today} />

                  <MemberUpdates updates={updatesByDay.today} />
                </View>
              </>
            )}

            {hasYesterday && (
              <>
                <Text variant="h3" className="pt-8">
                  Igår
                </Text>
                <View className="gap-6">
                  <AnsweredInvites invites={answeredByDay.yesterday} />
                  <ShowingEvents events={eventsByDay.yesterday} />
                  <MemberUpdates updates={updatesByDay.yesterday} />
                </View>
              </>
            )}

            {hasEarlier && (
              <>
                <Text variant="h3" className="pt-8">
                  Tidigare
                </Text>
                <View className="gap-6">
                  <AnsweredInvites invites={answeredByDay.earlier} />
                  <ShowingEvents events={eventsByDay.earlier} />
                  <MemberUpdates updates={updatesByDay.earlier} />
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
