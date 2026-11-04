import { MatchedListing, UserListing } from "@/types/listing";

// Flattens a user_listings row: the listing plus my is_new flag and the row id
export function toMatchedListing(row: UserListing): MatchedListing {
  return { ...row.listings, user_listing_id: row.id, is_new: row.is_new };
}
