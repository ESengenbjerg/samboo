import { useDeleteShowing } from "@/hooks/showings/useDeleteShowing";
import { useSaveShowing } from "@/hooks/showings/useSaveShowing";
import { useUpdateShowing } from "@/hooks/showings/useUpdateShowing";
import { ScheduledShowing, ShowingValues } from "@/types/showings";
import { toIsoDate } from "@/utils/date-format";
import { goToObject } from "@/utils/go-to-object";
import { googleMapsUrl } from "@/utils/google-maps-url";
import { Link } from "expo-router";
import {
  Clock,
  Edit,
  Globe,
  House,
  Map,
  NotebookPen,
  Trash,
} from "lucide-react-native";
import { useState } from "react";
import { Platform, View } from "react-native";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { SaveShowingDialog } from "../modals/save-showing-dialog";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

export default function ScheduledShowingInfo({
  onDeleted,
  onUpdated,
  onDeleteFailed,
  onStartAction,
  ...showing
}: ScheduledShowing & {
  onDeleted: () => void;
  onUpdated: () => void;
  onDeleteFailed: (message: string) => void;
  onStartAction: () => void;
}) {
  const timeText = showing.startsAt.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const {
    updateShowing,
    isUpdating,
    isGone,
    error: updateError,
    clearError: clearUpdateError,
  } = useUpdateShowing();

  const {
    saveShowing,
    isSaving,
    error: saveError,
    clearError: clearSaveError,
  } = useSaveShowing();
  const { deleteShowing, isDeleting } = useDeleteShowing();

  function openEditDialog() {
    clearUpdateError(); // Clears error from last time
    clearSaveError();
    onStartAction(); // Tells the parent to hide message from last action
    setEditDialogOpen(true);
  }

  function openDeleteDialog() {
    onStartAction(); // Tells the parent to hide message from last action
    setDeleteDialogOpen(true);
  }

  async function onUpdate(
    showingId: number,
    values: { date: string; time: string; note: string },
  ) {
    const ok = await updateShowing(
      showingId,
      values,
      toIsoDate(showing.startsAt),
    );

    if (ok) {
      setEditDialogOpen(false);
      onUpdated(); // Tells the parent to fetch the list again
    }
  }

  // The showing was deleted by someone else: save the typed values as a new one
  async function onSaveAsNew(values: ShowingValues) {
    const ok = await saveShowing(showing.listingId, values);

    if (ok) {
      setEditDialogOpen(false);
      onUpdated(); // Tells the parent to fetch the list again
    }
  }

  async function onDelete() {
    const errorMessage = await deleteShowing(showing.id);

    if (!errorMessage) {
      // Tells the parent to remove showing from the list
      onDeleted();
    } else {
      // Tells the parent to show the error
      onDeleteFailed(errorMessage);
    }
  }

  return (
    <View className="gap-8">
      <View className="flex-row justify-between items-center">
        {/* Address and area */}
        <View>
          <Button
            variant="link"
            onPress={() => goToObject(showing.listingId, "/saved/object/[id]")}
            className="self-start min-h-0 px-0 py-0 justify-start"
            style={Platform.select({
              web: { marginLeft: -12 },
              default: undefined,
            })}
          >
            <Icon as={House} className="size-[18px]" />
            <Text className="text-base font-sans-bold">{showing.address}</Text>
          </Button>
          <View className="flex-row gap-2 items-center">
            <Icon as={Globe} size={18} />
            <Text>{showing.area}</Text>
          </View>
        </View>

        {/* Time and map */}
        <View>
          <View className="flex-row gap-2 items-center">
            <Icon as={Clock} size={18}></Icon>
            <Text>{timeText}</Text>
          </View>
          <View className="flex-row gap-2 items-center">
            <Icon as={Map} size={18}></Icon>
            <Link
              aria-label={`Hitta hit, ${showing.address}`}
              href={googleMapsUrl(
                showing.address,
                showing.area,
                showing.municipality,
              )}
            >
              <Text className="underline">Hitta hit</Text>
            </Link>
          </View>
        </View>
      </View>

      {/* Note */}
      {showing.note?.trim() && (
        <View>
          <View className="flex-row items-center gap-2">
            <Icon as={NotebookPen} size={18} />
            <Text variant="bold" className="justify-start">
              Anteckning
            </Text>
          </View>
          <Text className="text-base">{showing.note}</Text>
        </View>
      )}

      {/* Delete and edit */}
      <View className="flex-row gap-4">
        <Button
          variant="link"
          onPress={openEditDialog}
          aria-label={`Redigera visning, ${showing.address}`}
          className="self-start min-h-0 px-0 py-0 justify-start"
          style={Platform.select({
            web: { marginLeft: -12 },
            default: undefined,
          })}
        >
          <Icon as={Edit} className="size-[18px]" />
          <Text className="text-base" variant="bold">
            Redigera
          </Text>
        </Button>
        <Button
          variant="link"
          onPress={openDeleteDialog}
          aria-label={`Radera visning, ${showing.address}`}
          className="self-start min-h-0 px-0 py-0 justify-start"
          style={Platform.select({
            web: { marginLeft: -12 },
            default: undefined,
          })}
        >
          <Icon as={Trash} className="size-[18px]" />
          <Text className="text-base" variant="bold">
            Radera
          </Text>
        </Button>
      </View>

      {editDialogOpen && (
        <SaveShowingDialog
          open={true}
          onOpenChange={() => setEditDialogOpen(false)}
          onSave={
            isGone ? onSaveAsNew : (values) => onUpdate(showing.id, values)
          }
          isSaving={isUpdating || isSaving}
          error={isGone ? (saveError ?? updateError) : updateError}
          title="Redigera visning"
          saveLabel={isGone ? "Spara som ny visning" : "Spara ändringar"}
          initialDate={showing.startsAt}
          initialTime={showing.startsAt}
          initialNote={showing.note ?? ""}
        />
      )}

      {deleteDialogOpen && (
        <ConfirmDialog
          open={true}
          onOpenChange={() => setDeleteDialogOpen(false)}
          title={"Radera visning"}
          description={
            "Om du raderar visningen försvinner den även för dina gruppmedlemmar om du är med i en grupp."
          }
          actionLabel={"Radera visning"}
          onAction={onDelete}
          cancelLabel={"Avbryt"}
          onCancel={() => setDeleteDialogOpen(false)}
          isLoading={isDeleting}
        />
      )}
    </View>
  );
}
