import { default as FeedUpdateNotification } from "@/components/notifications/feed-update-notification";
import GroupUpdateNotification from "@/components/notifications/group-update-notification";
import InviteUpdateNotification from "@/components/notifications/invitation-update-notification";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useGroupUpdates } from "@/hooks/useGroupUpdates";
import { useNewListingIds } from "@/hooks/useNewListingIds";
import { useSession } from "@/hooks/useSession";
import { MemberUpdate } from "@/types/notifications";
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

export default function NotificationsScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const accounts = useConnectedAccounts(userId);

  // Fetched once and used by both the feedUpdateNotification and the groupUpdateNotification
  // Refetches by itself every time the page is opened
  const { newListingIds } = useNewListingIds(session?.user.id);
  const { updatesByDay } = useGroupUpdates(userId, newListingIds);
  const { today, yesterday, earlier } = updatesByDay;

  // Reload invites every time the page is opened
  const { refresh } = accounts;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

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
        <View className="gap-6">
          <Card className="p-4 pb-8">
            <Text variant="bold">Idag</Text>
            <View className="gap-6 flex-1">
              <InviteUpdateNotification accounts={accounts} />
              <FeedUpdateNotification newObjects={newListingIds.size} />
              <MemberUpdates updates={today} />
            </View>
          </Card>

          {yesterday.length > 0 && (
            <Card className="p-4 pb-8">
              <Text variant="bold">Igår</Text>
              <View className="gap-6 flex-1">
                <InviteUpdateNotification accounts={accounts} />
                <FeedUpdateNotification newObjects={newListingIds.size} />
                <MemberUpdates updates={today} />
              </View>
            </Card>
          )}

          {earlier.length > 0 && (
            <Card className="p-4 pb-8">
              <Text variant="bold">Tidigare</Text>
              <View className="gap-6 flex-1">
                <InviteUpdateNotification accounts={accounts} />
                <FeedUpdateNotification newObjects={newListingIds.size} />
                <MemberUpdates updates={today} />
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
