import { Image } from "expo-image";
import { Trash } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

type ConnectedAccount = {
  name: string;
  avatar: string;
};

// TODO: Replace with correct info from Supabase
const DEV_CONNECTED_ACCOUNTS: ConnectedAccount[] = [
  {
    name: "Emilie",
    avatar:
      "https://i.pinimg.com/474x/50/2e/18/502e187b24c2755b5d62968ac4f6cc4b.jpg",
  },
  {
    name: "Maria",
    avatar: "https://www.kalaskungen.com/pub_images/original/SRFS9162.jpg",
  },
];

export default function ConnectedAccountsSettings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  // TODO: Delete when correct funtion from Supabase is implemented
  const [devIsDeleted, setDevIsDeleted] = useState(false);

  function onDelete() {
    // TODO: Function that removes connected account
  }
  return (
    <View>
      <Text variant="h2">Kopplade konton</Text>
      <View className="gap-2">
        {DEV_CONNECTED_ACCOUNTS.map((c) => (
          <View key={c.name} className="flex-row justify-between items-center">
            {/* Avatar and name */}
            <View className="flex-row items-center gap-3">
              <Image
                source={c.avatar}
                style={{ width: 16, height: 16, borderRadius: 8 }}
                contentFit="cover"
              />
              <Text>{c.name}</Text>
            </View>

            {dialogOpen && (
              <ConfirmDialog
                open={true}
                onOpenChange={() => setDialogOpen(false)}
                title={"Är du säker?"}
                description={
                  "Om du tar bort det kopplade kontot kan du inte längre se personens listor eller er gemensamma lista. Vill du verkligen radera det kopplade kontot?"
                }
                actionLabel={"Bekräfta radering"}
                // TODO: Implement correct funtion from Supabase
                onAction={() => setDevIsDeleted(true)}
                cancelLabel={"Avbryt"}
                onCancel={() => setDialogOpen(false)}
              />
            )}

            {/* Remove text and trash icon */}
            <Button
              variant="destructive"
              aria-label="Radera kopplat konto"
              onPress={() => setDialogOpen(true)}
              className="px-2 items-center"
            >
              <Text>Ta bort</Text>
              <Icon as={Trash} size={20} className="size-5" />
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
}
