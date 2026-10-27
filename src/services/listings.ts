import { supabase } from "@/lib/supabase";
import { UserListing } from "@/types/listing";

// TODO: Remove policy from listings table that give anon permission to read
export function getActiveListings(userId: string) {
  return (
    supabase
      .from("user_listings")
      // !inner removes deleted listings. Without !inner listings is null and
      // app will crash on listing.ld_json
      .select("id, is_new, liked, listings!inner(*)")
      .eq("user_id", userId)
      .is("listings.removed_at", null)
      // TODO: Update order to last_seen_at by editing in hook
      .order("created_at", { ascending: false })
      .overrideTypes<UserListing[]>()
  );
}

// listingId is listings.id (= user_listings.listing_id).
// Filter on user_id too, since RLS also shows group members' rows and
// .maybeSingle() fails if more than one row is returned.
export function getListing(userId: string, listingId: string) {
  return supabase
    .from("user_listings")
    .select("id, is_new, liked, listings!inner(*)")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .is("listings.removed_at", null)
    .maybeSingle()
    .overrideTypes<UserListing, { merge: false }>();
}
