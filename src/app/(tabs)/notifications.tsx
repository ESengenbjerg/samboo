import FeedUpdate from "@/components/notifications/feed-update";
import GroupUpdate from "@/components/notifications/group-update";
import InviteUpdate from "@/components/notifications/invitation-update";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { ScrollView, View } from "react-native";

export default function NotificationsScreen() {
  //   const { session } = useSession();
  //   const userId = session?.user.id;
  //   const accounts = useConnectedAccounts(session?.user.id);

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
          <Card className="p-4 pb-8 flex-1">
            <Text variant="bold">Idag</Text>
            <View className="gap-6 flex-1">
              <Separator />
              <GroupUpdate
                memberId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                memberName={"Admin"}
              />
              <Separator />
              <InviteUpdate
                fromUserId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                fromUserName={"Admin"}
              />
            </View>
          </Card>
          <Card className="p-4 pb-8 flex-1">
            <Text variant="bold">Igår</Text>
            <View className="gap-6 flex-1">
              <Separator />
              <GroupUpdate
                memberId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                memberName={"Admin"}
              />
              <Separator />
              <FeedUpdate newObjects={3} />
            </View>
          </Card>
          <Card className="p-4 pb-8">
            <Text variant="bold">Tidigare</Text>
            <View className="gap-6 flex-1">
              <Separator />
              <GroupUpdate
                memberId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                memberName={"Admin"}
              />
              <Separator />
              <FeedUpdate newObjects={3} />
              <Separator />
              <GroupUpdate
                memberId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                memberName={"Admin"}
              />
              <Separator />
              <FeedUpdate newObjects={3} />
              <Separator />
              <GroupUpdate
                memberId={"1822dc2a-fb08-496f-a20c-3ca730195af3"}
                memberName={"Admin"}
              />
              <Separator />
              <FeedUpdate newObjects={3} />
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
