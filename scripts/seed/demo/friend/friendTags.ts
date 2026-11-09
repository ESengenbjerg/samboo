// User 2's two tags (categories), put on some of the liked listings.
// Returns the number of tags created.
import { supabaseAdmin } from "../../../lib/supabaseAdmin.ts";
import { check, ok, type IdOf } from "../setup/helpers.ts";

export async function createFriendTags(
  user2: string,
  liked: number[],
  idOf: IdOf,
): Promise<number> {
  const userListings = check(
    await supabaseAdmin
      .from("user_listings")
      .select("id, listing_id")
      .eq("user_id", user2),
    "read user 2's user_listings",
  );
  const userListingId = new Map<number, number>(
    userListings.map((ul) => [ul.listing_id, ul.id]),
  );

  const tags = check(
    await supabaseAdmin
      .from("user_tags")
      .insert([
        { user_id: user2, tag_name: "Favoriter" },
        { user_id: user2, tag_name: "Nära spårvagn" },
      ])
      .select("id, tag_name"),
    "insert user 2's tags",
  );
  const tagId = new Map<string, number>(tags.map((t) => [t.tag_name, t.id]));

  const listingTags = [
    ...liked.slice(0, 3).map((n) => ({ tag: "Favoriter", n })),
    ...[liked[3], liked[5]].map((n) => ({ tag: "Nära spårvagn", n })),
  ];
  ok(
    await supabaseAdmin.from("listing_tags").insert(
      listingTags.map(({ tag, n }) => ({
        user_tag_id: tagId.get(tag)!,
        user_listing_id: userListingId.get(idOf(n))!,
      })),
    ),
    "tag user 2's listings",
  );

  return tags.length;
}
