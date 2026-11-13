import { Text } from "@/components/ui/text";
import { useSession } from "@/hooks/auth/useSession";
import { useSaveTag } from "@/hooks/tags/useSaveTag";
import { useUserTags } from "@/hooks/tags/useUserTags";
import { showToast } from "@/stores/toast";
import { UserTag } from "@/types/tags";
import { useState } from "react";
import { Pressable, View } from "react-native";
import FormError from "../form-error";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { EditTagsDialog } from "../modals/edit-tags-dialog";
import Tag from "../tags/tag";
import { Spinner } from "../ui/spinner";

export default function TagSettings() {
  const { session } = useSession();
  const userId = session?.user.id;

  const { tags, reload, isLoading, error: loadError } = useUserTags(userId);
  const { renameTag, deleteTag, isSaving, error, clearError } = useSaveTag();

  // Which tag is being edited, null when no dialog is open
  const [editingTag, setEditingTag] = useState<UserTag | null>(null);
  // The tag that's waiting on confirmation to be deleted
  const [deletingTag, setDeletingTag] = useState<UserTag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function openEdit(tag: UserTag) {
    clearError();
    setEditingTag(tag);
  }
  function closeEdit() {
    clearError();
    setEditingTag(null);
  }

  async function handleSave(newName: string) {
    if (!editingTag) return;

    // Unchanged name: just close, no request needed
    if (newName.trim().toLowerCase() === editingTag.tag_name.toLowerCase()) {
      closeEdit();
      return;
    }

    const updated = await renameTag(editingTag.id, newName);
    if (!updated) return; // Error is shown in dialog
    setEditingTag(null);
    showToast("Taggen är uppdaterad!", "success");
    reload();
  }

  // From delete in editDialog: close and ask about confirmation
  function askDelete() {
    if (!editingTag) return;
    setDeletingTag(editingTag);
    setEditingTag(null);
    clearError();
  }

  async function handleDelete() {
    if (!deletingTag) return;
    setIsDeleting(true);
    const ok = await deleteTag(deletingTag.id);
    setIsDeleting(false);
    setDeletingTag(null);
    if (ok) {
      reload();
      showToast("Taggen har raderats!", "success");
    }
  }

  return (
    <View className="gap-6">
      <View>
        <Text variant="h2">Dina taggar</Text>
        <Text>Klicka på en tagg för att redigera eller radera den.</Text>
      </View>

      {isLoading && <Spinner />}
      {loadError && <FormError>{loadError}</FormError>}
      {!isLoading && !loadError && tags.length === 0 && (
        <Text>Du har inga taggar ännu.</Text>
      )}

      <View className="flex-row flex-wrap gap-1">
        {tags.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => openEdit(t)}
            accessibilityRole="button"
            accessibilityLabel={`Redigera taggen ${t.tag_name}`}
          >
            <Tag text={t.tag_name} />
          </Pressable>
        ))}
      </View>

      {/* Error from failed delete. Edit error is shown in dialog */}
      {!editingTag && error && <FormError>{error}</FormError>}

      {editingTag && (
        <EditTagsDialog
          key={editingTag.id}
          open
          onOpenChange={(open) => {
            if (!open) closeEdit();
          }}
          tag={editingTag}
          onSave={handleSave}
          onDelete={askDelete}
          isSaving={isSaving}
          error={error}
          onClearError={clearError}
        />
      )}

      {deletingTag && (
        <ConfirmDialog
          open
          onOpenChange={() => setDeletingTag(null)}
          title="Radera tagg"
          description={`Är du säker på att du vill radera taggen ${deletingTag.tag_name}? Den tas också bort från alla annonser du har taggat.`}
          actionLabel={isDeleting ? "Raderar..." : "Radera tagg"}
          onAction={handleDelete}
          cancelLabel="Avbryt"
          onCancel={() => setDeletingTag(null)}
          isLoading={isDeleting}
        />
      )}
    </View>
  );
}
