import { SaveShowingDialog } from "@/components/modals/save-showing-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useSaveShowing } from "@/hooks/showings/useSaveShowing";
import { useShowingForListing } from "@/hooks/showings/useShowingForListing";
import { showToast } from "@/stores/toast";
import { ShowingValues } from "@/types/showings";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import FormMessage from "../form-message";
import ScheduledShowingInfo from "../saved/scheduled-showing-info";
import { Separator } from "../ui/separator";

type ScheduleShowingSectionProps = {
  // listings.id of the listing on the object page
  listingId: number;
};

export default function ScheduleShowingSection({
  listingId,
}: ScheduleShowingSectionProps) {
  // The existing showing (mine or my group's) for this listing, or null
  const { showing, refetch } = useShowingForListing(listingId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { saveShowing, isSaving, error, isConflict, clearError } =
    useSaveShowing();

  function openDialog() {
    clearError(); // Clears error from last time
    setMessage(null);
    setDialogOpen(true);
  }

  async function onSave(values: ShowingValues) {
    const ok = await saveShowing(listingId, values);

    if (ok) {
      setDialogOpen(false);
      setMessage("Visningen är sparad.");
      refetch();
    }
  }

  // The save hit "already a showing" (e.g. the partner saved one meanwhile).
  // Loads it, so it shows on the page with its own "Redigera" button
  async function onEditExisting() {
    const existing = await refetch();
    if (!existing) return;

    setDialogOpen(false);
    setMessage(
      "Det finns redan en visning. Tryck på Redigera för att ändra den.",
    );
  }

  return (
    <View className="gap-6">
      <View>
        <Text variant="h4">Har du bokat visning?</Text>
        <Text>
          {showing
            ? "Visningen finns i visningslistan."
            : "Lägg till visningen i visningslistan."}
        </Text>
      </View>

      {showing ? (
        <>
          <Separator />
          <ScheduledShowingInfo
            {...showing}
            onStartAction={() => setMessage(null)}
            onUpdated={() => {
              setMessage("Visningen är uppdaterad.");
              refetch();
            }}
            onDeleted={() => {
              setMessage("Visningen är raderad.");
              refetch();
            }}
            onDeleteFailed={() =>
              showToast("Kunde inte radera visningen, försök igen")
            }
          />
        </>
      ) : (
        <Button variant="outline" onPress={openDialog} className="w-52">
          <Text>Spara visning i lista</Text>
          <Icon as={Plus} size={18} />
        </Button>
      )}

      {message && <FormMessage>{message}</FormMessage>}

      {dialogOpen && (
        <SaveShowingDialog
          open={true}
          onOpenChange={() => setDialogOpen(false)}
          onSave={onSave}
          isSaving={isSaving}
          error={error}
          onEditExisting={isConflict ? onEditExisting : undefined}
        />
      )}
    </View>
  );
}
