import { supabase } from "@/lib/supabase";

// The listings columns the app reads, the same as the Listing type. Never "*": that would also download ld_json, up to 300 kB per listing, which the app does not use
const LISTING_COLUMNS =
  "id, agency, external_id, url, property_type, municipality, area, price, rooms, living_area, monthly_fee, address, image_url, is_new_construction, latitude, longitude, build_year, plot_area, floor_level, description";

// TODO: Remove policy from listings table that give anon permission to read
export function getActiveListings(userId: string) {
  return (
    supabase
      .from("user_listings")
      // !inner removes deleted listings. Without !inner listings is null and
      // app will crash on listing.address
      .select("id, is_new, liked, listings!inner(*)")
      .eq("user_id", userId)
      .is("listings.removed_at", null)
      // TODO: Update order to last_seen_at by editing in hook
      .order("created_at", { ascending: false })
  );
}

export function getLikedListings(userId: string) {
  return (
    supabase
      .from("user_listings")
      // !inner removes deleted listings. Without !inner listings is null and
      // app will crash on listing.address
      .select("id, is_new, liked, listings!inner(*)")
      .eq("user_id", userId)
      .eq("liked", true)
      .is("listings.removed_at", null)
      // TODO: Update order to last_seen_at by editing in hook
      .order("created_at", { ascending: false })
  );
}

// Only the ids of the listings I have liked, to show a filled heart on every card
// without fetching the listings again
export function getLikedListingIds(userId: string) {
  return supabase
    .from("user_listings")
    .select("listing_id")
    .eq("user_id", userId)
    .eq("liked", true);
}

// Like a listing by listings.id. Goes through like_listing() instead of an update, because
// a listing that a group member has liked may not have a user_listings row for me yet
export function likeListing(listingId: number) {
  return supabase.rpc("like_listing", { p_listing_id: listingId });
}

// Mark a listing as seen by listings.id. Goes through mark_listing_seen() because is_new can
// not be updated directly. Sets is_new = false on my row if I have one, and always remembers
// the listing as seen (seen_listings), also a group member's listing outside my search.
// Call it every time a listing page opens. Listings not visible to me are silently ignored
export function markListingSeen(listingId: number) {
  return supabase.rpc("mark_listing_seen", { p_listing_id: listingId });
}

// The listing ids (listings.id) that are new to me: my own matches I have not opened, plus
// listings a group member has liked that I have never opened (also outside my search).
// Matching on listings.id lets "new" work in every list, the same way as the category filter.
// Removed listings are left out by the database.
// STABLE function: must be called with GET (see docs/database-design.md)
export async function getNewListingIds() {
  const { data, error } = await supabase.rpc("my_new_listing_ids", undefined, {
    get: true,
  });
  return { data: data ?? [], error };
}

// How many listings in MY search I have not opened yet (is_new = true), for the "new listings
// in your search" notification. Not my_new_listing_ids(): it also contains group members' likes
// outside my search. head: true only returns the count, no rows.
// !inner leaves out removed listings, so the number matches the "Ny" flags in the feed
export function getNewMatchesCount(userId: string) {
  return supabase
    .from("user_listings")
    .select("id, listings!inner(id)", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_new", true)
    .is("listings.removed_at", null);
}

// Unlike a listing by listings.id. The row is kept (only liked is changed), see match_user_listings().
// RLS only lets me update my own rows, user_id is there to be explicit
export function unlikeListing(userId: string, listingId: number) {
  return supabase
    .from("user_listings")
    .update({ liked: false })
    .eq("user_id", userId)
    .eq("listing_id", listingId);
}

// Liked listings of several users at once, e.g. the members of my group.
// RLS lets me read user_listings for everyone in my group. user_id tells whose row it is
export function getLikedListingsForUsers(userIds: string[]) {
  return (
    supabase
      .from("user_listings")
      // !inner removes deleted listings, see getLikedListings()
      // liked_at is used by the notifications page to sort the members' updates by day
      .select("id, user_id, is_new, liked, liked_at, listings!inner(*)")
      .in("user_id", userIds)
      .eq("liked", true)
      .is("listings.removed_at", null)
      .order("created_at", { ascending: false })
  );
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
  return { data, error };
}

// A single listing by listings.id, without the user_listings row.
// RLS lets me read listings matched to me or to anyone in my group, so this works
// for my own listings as well as a group member's
export function getListingById(listingId: string) {
  return supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", Number(listingId))
    .is("removed_at", null)
    .maybeSingle();
}

// listingId is listings.id (= user_listings.listing_id).
// Filter on user_id too, since RLS also shows group members' rows and
// .maybeSingle() fails if more than one row is returned.
export function getListing(userId: string, listingId: string) {
  return supabase
    .from("user_listings")
    .select(`id, is_new, liked, listings!inner(${LISTING_COLUMNS})`)
    .eq("user_id", userId)
    .eq("listing_id", Number(listingId))
    .is("listings.removed_at", null)
    .maybeSingle();
}
