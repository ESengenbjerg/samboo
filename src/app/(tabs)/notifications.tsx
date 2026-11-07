import AnsweredInviteNotification from "@/components/notifications/answered-invitation-notification";
import { default as FeedUpdateNotification } from "@/components/notifications/feed-update-notification";
import GroupUpdateNotification from "@/components/notifications/group-update-notification";
import InviteUpdateNotification from "@/components/notifications/invitation-update-notification";
import { Text } from "@/components/ui/text";
import { useAnsweredInvites } from "@/hooks/useAnsweredInvites";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useGroupUpdates } from "@/hooks/useGroupUpdates";
import { useMarkNotificationsSeen } from "@/hooks/useMarkNotificationsSeen";
import { useNewListingIds } from "@/hooks/useNewListingIds";
import { useNewMatchesCount } from "@/hooks/useNewMatchesCount";
import { useSession } from "@/hooks/useSession";
import { AnsweredInvite, MemberUpdate } from "@/types/notifications";
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

export default function NotificationsScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const accounts = useConnectedAccounts(userId);

  // Refetches by itself every time the page is opened
  const { newMatchesCount } = useNewMatchesCount(userId);
  const { newListingIds } = useNewListingIds(session?.user.id);
  const { updatesByDay } = useGroupUpdates(userId, newListingIds);
  const { answeredByDay } = useAnsweredInvites(accounts);

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

  const hasYesterday =
    updatesByDay.yesterday.length > 0 || answeredByDay.yesterday.length > 0;
  const hasEarlier =
    updatesByDay.earlier.length > 0 || answeredByDay.earlier.length > 0;

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
        <View className="gap-2">
          <Text variant="h3" className="pt-4">
            Idag
          </Text>
          <View className="gap-6">
            <InviteUpdateNotification accounts={accounts} />
            <AnsweredInvites invites={answeredByDay.today} />
            <FeedUpdateNotification newObjects={newMatchesCount} />
            <MemberUpdates updates={updatesByDay.today} />
          </View>

          {hasYesterday && (
            <>
              <Text variant="h3" className="pt-8">
                Igår
              </Text>
              <View className="gap-6">
                <AnsweredInvites invites={answeredByDay.yesterday} />
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
                <MemberUpdates updates={updatesByDay.earlier} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
