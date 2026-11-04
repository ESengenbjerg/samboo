import {
  addListingTag,
  createUserTag,
  deleteUserTag,
  removeListingTag,
} from "@/services/tags";
import { UserTag } from "@/types/tags";
import { useCallback, useState } from "react";

// Create/delete tags and apply/remove them on a listing.
// Every function returns true (or the new tag) on success, false/null on failure.
// TODO: Implement validation (empty name, max 100 characters) and refetch of
// useUserTags / useListingTags after a change
export function useSaveTag() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTag = useCallback(
    async (userId: string, name: string): Promise<UserTag | null> => {
      setError(null);
      setIsSaving(true);
      const { data, error } = await createUserTag(userId, name.trim());
      setIsSaving(false);

      if (error) {
        console.error("Failed to create tag: ", error);
        // 23505 = user_tags_unique
        setError(
          error.code === "23505"
            ? "Du har redan en kategori med det namnet."
            : "Kunde inte skapa kategorin. Försök igen.",
        );
        return null;
      }
      return data;
    },
    [],
  );

  const deleteTag = useCallback(async (tagId: number) => {
    setError(null);
    const { error } = await deleteUserTag(tagId);
    if (error) {
      console.error("Failed to delete tag: ", error);
      setError("Kunde inte radera kategorin. Försök igen.");
      return false;
    }
    return true;
  }, []);

  const applyTag = useCallback(
    async (userTagId: number, userListingId: number) => {
      setError(null);
      const { error } = await addListingTag(userTagId, userListingId);
      if (error) {
        console.error("Failed to apply tag: ", error);
        setError("Kunde inte kategorisera annonsen. Försök igen.");
        return false;
      }
      return true;
    },
    [],
  );

  const unapplyTag = useCallback(
    async (userTagId: number, userListingId: number) => {
      setError(null);
      const { error } = await removeListingTag(userTagId, userListingId);
      if (error) {
        console.error("Failed to remove tag: ", error);
        setError("Kunde inte ta bort kategorin från annonsen. Försök igen.");
        return false;
      }
      return true;
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { createTag, deleteTag, applyTag, unapplyTag, isSaving, error, clearError };
}
