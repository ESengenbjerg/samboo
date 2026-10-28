import { supabase } from "@/lib/supabase";
import { Listing, MemberUserListing, UserListing } from "@/types/listing";

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

export function getLikedListings(userId: string) {
  return (
    supabase
      .from("user_listings")
      // !inner removes deleted listings. Without !inner listings is null and
      // app will crash on listing.ld_json
      .select("id, is_new, liked, listings!inner(*)")
      .eq("user_id", userId)
      .eq("liked", true)
      .is("listings.removed_at", null)
      // TODO: Update order to last_seen_at by editing in hook
      .order("created_at", { ascending: false })
      .overrideTypes<UserListing[]>()
  );
}

// Liked listings of several users at once, e.g. the members of my group.
// RLS lets me read user_listings for everyone in my group. user_id tells whose row it is
export function getLikedListingsForUsers(userIds: string[]) {
  return supabase
    .from("user_listings")
    // !inner removes deleted listings, see getLikedListings()
    .select("id, user_id, is_new, liked, listings!inner(*)")
    .in("user_id", userIds)
    .eq("liked", true)
    .is("listings.removed_at", null)
    .order("created_at", { ascending: false })
    .overrideTypes<MemberUserListing[]>();
}

// The shared list ("Gemensam lista"): listings that every member of my group has liked.
// Calculated by the database on every call. Empty if I am not in a group
export async function getSharedLikedListings() {
  const { data, error } = await supabase
    // GET: the function is read-only (STABLE), see getGroupMembers() in groups.ts
    .rpc("shared_likes", undefined, { get: true })
    // shared_likes() does not skip listings that have disappeared from the agency's site
    .is("removed_at", null)
    .order("created_at", { ascending: false });
  return { data: data as Listing[] | null, error };
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
