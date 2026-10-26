import { supabase } from "@/lib/supabase";
import { Listing, UserListing } from "@/types/listing";

// TODO: Remove policy from listings table that give anon permission to read
export function getActiveListings(userId: string) {
  return supabase
    .from("user_listings")
    // !inner removes deleted listings. Eithout !inner listings is null and
    // app will crash on listing.ld_json
    .select("id, is_new, liked, listings!inner(*)")
    .eq("user_id", userId)
    .is("listings.removed_at", null)
    // TODO: Update order to last_seen_at by editing in hook
    .order("created_at", { ascending: false })
    .overrideTypes<UserListing[]>();
}
