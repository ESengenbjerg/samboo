import { Listing } from "@/types/listing";

// New construction ("nyproduktion"), from the listings.is_new_construction column
export function isNewConstruction(listing: Listing) {
  return listing.is_new_construction;
}
