import { Listing } from "@/types/listing";

// New construction ("nyproduktion"). Uses the database column and falls back to the
// flag the agency put in ld_json, for rows where the column is not selected
export function isNewConstruction(listing: Listing) {
  return listing.is_new_construction ?? listing.ld_json.newConstruction ?? false;
}
