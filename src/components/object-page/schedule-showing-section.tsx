import { SaveShowingDialog } from "@/components/modals/save-showing-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useSaveShowing } from "@/hooks/useSaveShowing";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import FormMessage from "../form-message";

type ScheduleShowingSectionProps = {
  // listings.id of the listing on the object page
  listingId: number;
};

// TODO: Save the showing (listingId is not used yet)
export default function ScheduleShowingSection({
  listingId,
}: ScheduleShowingSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const { saveShowing, isSaving, error, clearError } = useSaveShowing();

  function openDialog() {
    clearError(); // Clears error from last time
    setSaved(false);
    setDialogOpen(true);
  }

  async function onSave(values: { date: string; time: string; note: string }) {
    const ok = await saveShowing(listingId, values);

    if (ok) {
      setDialogOpen(false);
      setSaved(true);
    }
  }

  return (
    <View className="gap-6">
      <View>
        <Text variant="h4">Har du bokat visning?</Text>
        <Text>Lägg till visningen i visningslistan.</Text>
      </View>
      <Button variant="outline" onPress={openDialog} className="w-52">
        <Text>Spara visning i lista</Text>
        <Icon as={Plus} size={18} />
      </Button>

      {saved && <FormMessage>Visningen är sparad.</FormMessage>}

      {dialogOpen && (
        <SaveShowingDialog
          open={true}
          onOpenChange={() => setDialogOpen(false)}
          onSave={onSave}
          isSaving={isSaving}
          error={error}
        />
      )}
    </View>
  );
}
