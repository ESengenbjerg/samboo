import { supabase } from "@/lib/supabase";
import { ListingTag, UserTag } from "@/types/tags";

// RLS only returns my own tags
export function getUserTags() {
  return supabase
    .from("user_tags")
    .select("id, tag_name")
    .order("tag_name", { ascending: true })
    .overrideTypes<UserTag[]>();
}

// tag_name must be 1-100 characters and unique per user (error code 23505 if it exists)
export function createUserTag(userId: string, tagName: string) {
  return supabase
    .from("user_tags")
    .insert({ user_id: userId, tag_name: tagName })
    .select("id, tag_name")
    .single()
    .overrideTypes<UserTag, { merge: false }>();
}

// Deleting a tag also deletes its listing_tags (cascade)
export function deleteUserTag(tagId: number) {
  return supabase.from("user_tags").delete().eq("id", tagId);
}

// All my tag applications, to show tags on cards. RLS limits it to my own user_listings.
// listing_id comes through the foreign key to user_listings, so callers can match on listings.id
export function getListingTags() {
  return supabase
    .from("listing_tags")
    .select("id, user_tag_id, user_listing_id, user_listings(listing_id)")
    .overrideTypes<ListingTag[]>();
}

// userListingId is user_listings.id (MatchedListing.user_listing_id), not listings.id
export function addListingTag(userTagId: number, userListingId: number) {
  return supabase
    .from("listing_tags")
    .insert({ user_tag_id: userTagId, user_listing_id: userListingId });
}

export function removeListingTag(userTagId: number, userListingId: number) {
  return supabase
    .from("listing_tags")
    .delete()
    .eq("user_tag_id", userTagId)
    .eq("user_listing_id", userListingId);
}
