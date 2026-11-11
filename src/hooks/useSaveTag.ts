import {
  addListingTag,
  createUserTag,
  deleteUserTag,
  removeListingTag,
} from "@/services/tags";
import { UserTag } from "@/types/tags";
import { capitalize } from "@/utils/capitalize-string";
import { useCallback, useState } from "react";

// check_request() rate limit on write requests
const RATE_LIMITED_MESSAGE =
  "Du har gjort för många ändringar. Vänta en stund och försök igen.";

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
        // 23505 = user_tags_unique. P0001 = limit_tags_per_user(), its message is already in Swedish
        if (error.code === "rate_limited") setError(RATE_LIMITED_MESSAGE);
        else if (error.code === "23505")
          setError("Du har redan en tagg med det namnet.");
        else if (error.code === "P0001") setError(error.message);
        else setError("Kunde inte skapa tagg. Försök igen.");
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
      setError("Kunde inte radera taggen. Försök igen.");
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
          error.code === "rate_limited"
            ? RATE_LIMITED_MESSAGE
            : "Kunde inte tagga annonsen. Försök igen.",
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
          error.code === "rate_limited"
            ? RATE_LIMITED_MESSAGE
            : "Kunde inte ta bort taggen från annonsen. Försök igen.",
        );
        return false;
      }
      return true;
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    createTag,
    deleteTag,
    applyTag,
    unapplyTag,
    isSaving,
    error,
    clearError,
  };
}
