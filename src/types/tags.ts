import type { Tables } from "@shared/database.types";

// A tag the user has created (user_tags)
export type UserTag = Pick<Tables<"user_tags">, "id" | "tag_name">;

// A tag applied to a matched listing (listing_tags)
export type ListingTag = Pick<
  Tables<"listing_tags">,
  "id" | "user_tag_id" | "user_listing_id"
> & {
  // The listing the tagged user_listings row points to. Used to match on listings.id,
  // so my tags also apply in a group member's list and in the shared list
  user_listings: Pick<Tables<"user_listings">, "listing_id">;
};

// Everything needed to save the tags dialog in one go
export type SaveTagsInput = {
  userId: string;
  // user_listings.id of the listing being tagged
  userListingId: number;
  // My tags as currently loaded. Used to reuse a tag if it already exists
  existingTags: UserTag[];
  // The tag ids selected in the dialog, and the ones it was opened with
  selectedIds: number[];
  initialIds: number[];
  // Names typed in the dialog that are not created yet
  newNames: string[];
};
