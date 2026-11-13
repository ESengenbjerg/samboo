import type { Listing } from "@/types/listing";

// True when the scraper did not find the listing in its latest run. The app shows it as
// "Hittas inte" until the database deletes it (10 days), or the scraper finds it again
export function isListingRemoved(listing: Pick<Listing, "removed_at">) {
  return listing.removed_at !== null;
}
