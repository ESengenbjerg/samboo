import {
  addListingTag,
  createUserTag,
  deleteUserTag,
  removeListingTag,
  updateUserTag,
} from "@/services/tags";
import { SaveTagsInput, UserTag } from "@/types/tags";
import { capitalize } from "@/utils/capitalize-string";
import { commonErrorMessage } from "@/utils/error-message/common-messages";
import { useCallback, useState } from "react";

// The message for a failed create or rename. 23505 = user_tags_unique.
// P0001 = limit_tags_per_user(), its message is already in Swedish
function saveTagErrorMessage(
  error: { code?: string; message: string },
  fallback: string,
) {
  if (error.code === "23505") return "Du har redan en tagg med det namnet.";
  if (error.code === "P0001") return error.message;
  // Offline and rate limit (rate_limited) get their own text
  return commonErrorMessage(error, fallback);
}

// Create/delete tags and apply/remove them on a listing.
// Every function returns true (or the new tag) on success, false/null on failure.
// The caller refetches useUserTags / useListingTags after a change. Empty names are
// stopped in the dialog and the name length is limited by the input and the database
export function useSaveTag() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTag = useCallback(
    async (userId: string, name: string): Promise<UserTag | null> => {
      setError(null);
      setIsSaving(true);
      const { data, error } = await createUserTag(
        userId,
        // Stored in one spelling, so "villa" and "Villa" hit the unique rule in the database
        capitalize(name.trim()),
      );
      setIsSaving(false);

      if (error) {
        console.error("Failed to create tag: ", error);
        setError(
          saveTagErrorMessage(error, "Kunde inte skapa tagg. Försök igen."),
        );
        return null;
      }
      return data;
    },
    [],
  );

  const renameTag = useCallback(
    async (tagId: number, name: string): Promise<UserTag | null> => {
      setError(null);
      setIsSaving(true);
      const { data, error } = await updateUserTag(
        tagId,
        // Same spelling as createTag, so "villa" and "Villa" hit the unique rule
        capitalize(name.trim()),
      );
      setIsSaving(false);

      if (error) {
        console.error("Failed to rename tag: ", error);
        setError(
          saveTagErrorMessage(
            error,
            "Kunde inte byta namn på taggen. Försök igen.",
          ),
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
      setError(
        commonErrorMessage(error, "Kunde inte radera taggen. Försök igen."),
      );
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
        setError(
          commonErrorMessage(error, "Kunde inte tagga annonsen. Försök igen."),
        );
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
        setError(
          commonErrorMessage(
            error,
            "Kunde inte ta bort taggen från annonsen. Försök igen.",
          ),
        );
        return false;
      }
      return true;
    },
    [],
  );

  // Saves the dialog: creates the new tags first, then applies/removes tags on the listing.
  // Returns true only if everything succeeded. Stops at the first failed create, so a tag is
  // never applied without the user seeing the error. The caller should reload both tag lists
  // afterwards, also on failure, since some tags may have been created before the failure
  const saveTags = useCallback(
    async ({
      userId,
      userListingId,
      existingTags,
      selectedIds,
      initialIds,
      newNames,
    }: SaveTagsInput) => {
      setError(null);
      const toAdd = selectedIds.filter((id) => !initialIds.includes(id));
      const toRemove = initialIds.filter((id) => !selectedIds.includes(id));

      for (const name of newNames) {
        // Created by an earlier attempt that failed halfway: reuse it, never create twice
        const existing = existingTags.find(
          (t) => t.tag_name.toLowerCase() === name.toLowerCase(),
        );
        const id = existing?.id ?? (await createTag(userId, name))?.id;
        if (id === undefined) return false;
        if (!initialIds.includes(id) && !toAdd.includes(id)) toAdd.push(id);
      }

      const results = await Promise.all([
        ...toAdd.map((id) => applyTag(id, userListingId)),
        ...toRemove.map((id) => unapplyTag(id, userListingId)),
      ]);
      return results.every(Boolean);
    },
    [createTag, applyTag, unapplyTag],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    createTag,
    renameTag,
    deleteTag,
    applyTag,
    unapplyTag,
    saveTags,
    isSaving,
    error,
    clearError,
  };
}
