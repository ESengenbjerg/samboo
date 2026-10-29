import { SaveShowingDialog } from "@/components/modals/save-showing-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

type ScheduleShowingSectionProps = {
  // listings.id of the listing on the object page
  listingId: number;
};

// TODO: Save the showing (listingId is not used yet)
export default function ScheduleShowingSection({
  listingId,
}: ScheduleShowingSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <View className="gap-6">
      <View>
        <Text variant="h4">Har du bokat visning?</Text>
        <Text>Lägg in din bokade visning i er gemensamma visningslista.</Text>
      </View>
      <Button
        variant="outline"
        onPress={() => setDialogOpen(true)}
        className="w-52"
      >
        <Text>Spara visning i lista</Text>
        <Icon as={Plus} size={18} />
      </Button>

      {dialogOpen && (
        <SaveShowingDialog
          open={true}
          onOpenChange={() => setDialogOpen(false)}
          onSave={() => setDialogOpen(false)}
        />
      )}
    </View>
  );
}
