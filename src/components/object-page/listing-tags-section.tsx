import { useListingTagEditor } from "@/hooks/tags/useListingTagEditor";
import { Listing } from "@/types/listing";
import { isNewConstruction } from "@/utils/is-new-construction";
import { PlusSquare } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import FormError from "../form-error";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { TagsDialog } from "../modals/tags-dialog";
import Tag from "../tags/tag";
import { Icon } from "../ui/icon";
import { Text } from "../ui/text";

// The tags of one listing: my own tags, the "new construction" tag, and the dialogs
// to add or remove tags
export default function ListingTagsSection({ listing }: { listing: Listing }) {
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<number | null>(null);

  const {
    tags,
    appliedTagIds,
    canEdit,
    error,
    saveError,
    isSaving,
    clearError,
    save,
    remove,
  } = useListingTagEditor(listing);

  async function handleSave(
    selectedIds: number[],
    initialIds: number[],
    newNames: string[],
  ) {
    const ok = await save(selectedIds, initialIds, newNames);
    // Keep the dialog open if something failed, so error is visible
    if (ok) setTagsDialogOpen(false);
  }

  // Clears an old error from a previous attempt before the dialog opens
  function openTagsDialog() {
    clearError();
    setTagsDialogOpen(true);
  }

  // Clears an old error when dialog is closed
  function closeTagsDialog() {
    clearError();
    setTagsDialogOpen(false);
  }

  return (
    <>
      <View className="gap-2">
        {/* Only possible if I have my own user_listings row and the tags are loaded */}
        {canEdit && (
          <Pressable
            onPress={openTagsDialog}
            role="button"
            aria-label="Lägg till taggar"
            className="flex-row justify-start items-center gap-1 w-[50%]"
          >
            <Text variant="bold">Lägg till taggar</Text>
            <Icon as={PlusSquare} size={18} />
          </Pressable>
        )}
        <View className="flex-row flex-wrap justify-start gap-2">
          {isNewConstruction(listing) && <Tag isNewConstruction />}
          {/* My own tags on this listing */}
          {tags
            .filter((t) => appliedTagIds.includes(t.id))
            .map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTagToDelete(t.id)}
                role="button"
                aria-label={`Ta bort taggen ${t.tag_name}`}
              >
                <Tag text={t.tag_name} removable />
              </Pressable>
            ))}
        </View>
        {/* Confirm dialog before deleting tag */}
        {tagToDelete !== null && (
          <ConfirmDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) setTagToDelete(null);
            }}
            title={"Ta bort tagg"}
            description={"Vill du ta bort taggen från objektet?"}
            actionLabel={"Ta bort"}
            onAction={async () => {
              await remove(tagToDelete);
              setTagToDelete(null);
            }}
            cancelLabel={"Avbryt"}
            onCancel={() => setTagToDelete(null)}
            isLoading={isSaving}
          />
        )}

        {/* The dialog shows its own error, so only show it here when it is closed */}
        {error && !tagsDialogOpen && <FormError>{error}</FormError>}
      </View>

      {tagsDialogOpen && (
        <TagsDialog
          open={tagsDialogOpen}
          onOpenChange={closeTagsDialog}
          tags={tags}
          selectedIds={appliedTagIds}
          onSave={handleSave}
          isSaving={isSaving}
          error={saveError}
          onClearError={clearError}
        />
      )}
    </>
  );
}
