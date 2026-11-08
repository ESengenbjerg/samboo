import { useDeleteShowing } from "@/hooks/useDeleteShowing";
import { useUpdateShowing } from "@/hooks/useUpdateShowing";
import { ScheduledShowing } from "@/types/showings";
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
import { SaveShowingDialog } from "../modals/save-showing-dialog";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

export default function ScheduledShowingInfo(showing: ScheduledShowing) {
  const timeText = showing.startsAt.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [saved, setSaved] = useState(false);
  const {
    updateShowing,
    isUpdating,
    error: updateError,
    clearError: clearUpdateError,
  } = useUpdateShowing();

  const {
    deleteShowing,
    isDeleting,
    error: deleteError,
    clearError: clearDeleteError,
  } = useDeleteShowing();

  function openEditDialog() {
    clearUpdateError(); // Clears error from last time
    setSaved(false);
    setEditDialogOpen(true);
  }

  function openDeleteDialog() {
    clearDeleteError(); // Clears error from last time
    setSaved(false);
    setDeleteDialogOpen(true);
  }

  async function onUpdate(
    showingId: number,
    values: { date: string; time: string; note: string },
  ) {
    const ok = await updateShowing(showingId, values);

    if (ok) {
      setEditDialogOpen(false);
      setSaved(true);
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
            <Text className="text-base" variant="bold">
              {showing.address}
            </Text>
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

      {/* TODO: Add edit action for showing date, time and note. */}
      {/* TODO: Add delete action with confirmation. */}

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
      <View className="flex-row">
        <Button
          variant="link"
          onPress={openEditDialog}
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
          onPress={() => setDeleteDialogOpen}
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

      {saved && <Text>Visning uppdaterad</Text>}

      {editDialogOpen && (
        <SaveShowingDialog
          open={true}
          onOpenChange={() => setEditDialogOpen(false)}
          onSave={(values) => onUpdate(showing.id, values)}
          isSaving={isUpdating}
          error={updateError}
          initialDate={showing.startsAt}
          initialTime={showing.startsAt}
          initialNote={showing.note ?? ""}
        />
      )}
    </View>
  );
}
