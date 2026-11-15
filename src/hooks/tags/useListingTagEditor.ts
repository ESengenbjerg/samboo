import { useSession } from "@/hooks/auth/useSession";
import { useListing } from "@/hooks/listings/useListing";
import { useListingTags } from "@/hooks/tags/useListingTags";
import { useSaveTag } from "@/hooks/tags/useSaveTag";
import { useUserTags } from "@/hooks/tags/useUserTags";
import { Listing } from "@/types/listing";
import { useState } from "react";

// Everything the tags section of the object page needs: my tags, the ones applied
// to this listing, and the actions to save or remove them
export function useListingTagEditor(listing: Listing) {
  const { session } = useSession();
  const userId = session?.user.id;

  const [isSaving, setIsSaving] = useState(false);

  // My user_listings row for this listing (id and is_new).
  // null if a group member has been matched with the listing, but not the session user
  const { userListing, error: userListingError } = useListing(
    String(listing.id),
  );

  const {
    tags,
    reload: reloadTags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useUserTags(userId);
  const {
    listingTags,
    reload: reloadListingTags,
    isLoading: listingTagsLoading,
    error: listingTagsError,
  } = useListingTags(userId);
  const {
    unapplyTag,
    saveTags,
    isSaving: isSavingTag,
    error: saveTagError,
    clearError,
  } = useSaveTag();

  // Load errors (tags or applied tags) and save errors are shown in the same place
  const error =
    userListingError || tagsError || listingTagsError || saveTagError;
  // The dialog starts from the applied tags, so it must not open before both lists are
  // loaded. Otherwise saving would remove tags that just had not been fetched yet
  const canEdit =
    !!userListing &&
    !tagsLoading &&
    !listingTagsLoading &&
    !tagsError &&
    !listingTagsError;

  // The ids of my tags (user_tags.id) that are on this listing.
  // listingTags holds every tag application I have, so filter on this listing's row
  const appliedTagIds = userListing
    ? listingTags
        .filter((lt) => lt.user_listing_id === userListing.id)
        .map((lt) => lt.user_tag_id)
    : [];

  // Called by the dialog with the selected tag ids, the ids the dialog was opened
  // with, and the names of new tags. New tags are created here, on save.
  // Returns true if everything was saved
  async function save(
    selectedIds: number[],
    initialIds: number[],
    newNames: string[],
  ) {
    if (!userId || !userListing) return false;
    setIsSaving(true);
    try {
      const ok = await saveTags({
        userId,
        userListingId: userListing.id,
        existingTags: tags,
        selectedIds,
        initialIds,
        newNames,
      });

      // Always fetch again, also on failure: some tags might have been created before it failed
      reloadTags();
      reloadListingTags();

      return ok;
    } finally {
      setIsSaving(false);
    }
  }

  // Removes one tag from this listing directly, without opening the dialog
  async function remove(tagId: number) {
    if (!userListing) return;

    const removed = await unapplyTag(tagId, userListing.id);
    if (removed) reloadListingTags();
  }

  return {
    tags,
    appliedTagIds,
    canEdit,
    error,
    saveError: saveTagError,
    isSaving: isSaving || isSavingTag,
    clearError,
    save,
    remove,
  };
}
