import FeedUpdate from "@/components/notifications/feed-notification";
import GroupUpdate from "@/components/notifications/group-notification";
import InviteUpdate from "@/components/notifications/invitation-notification";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useSession } from "@/hooks/useSession";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ScrollView, View } from "react-native";

export default function NotificationsScreen() {
  const { session } = useSession();
  const accounts = useConnectedAccounts(session?.user.id);

  // Reload invites every time the page is opened, same as the settings tab
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
              <GroupUpdate
                memberId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                memberName={"Admin"}
              />
              <InviteUpdate accounts={accounts} />
            </View>
          </Card>
          <Card className="p-4 pb-8">
            <Text variant="bold">Igår</Text>
            <View className="gap-6 flex-1">
              <GroupUpdate
                memberId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                memberName={"Admin"}
              />
              <FeedUpdate newObjects={3} />
            </View>
          </Card>
          <Card className="p-4 pb-8">
            <Text variant="bold">Tidigare</Text>
            <View className="gap-6 flex-1">
              <GroupUpdate
                memberId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                memberName={"Admin"}
              />
              <FeedUpdate newObjects={3} />
              <GroupUpdate
                memberId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                memberName={"Admin"}
              />
              <FeedUpdate newObjects={3} />
              <GroupUpdate
                memberId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                memberName={"Admin"}
              />
              <FeedUpdate newObjects={3} />
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
