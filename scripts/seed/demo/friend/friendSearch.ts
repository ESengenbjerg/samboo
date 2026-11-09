// User 2's search, and what user 2 has liked and seen among the matches.
// Returns the number of matches and the listing numbers user 2 liked (not counting the removed ones).
import { supabaseAdmin } from "../../../lib/supabaseAdmin.ts";
import { check, fail, ok, type IdOf } from "../setup/helpers.ts";
import { REMOVED } from "../listings/listingRows.ts";

export async function createFriendSearch(
  user2: string,
  idOf: IdOf,
): Promise<{ matchedCount: number; liked: number[] }> {
  // The trigger search_params_match runs match_user_listings() and fills user_listings.
  // Göteborg, plots, holiday homes and listings above 6.5 million fall outside, so it is visible that the search filters
  ok(
    await supabaseAdmin.from("search_params").insert({
      user_id: user2,
      property_types: ["lagenhet", "radhus", "villa"],
      municipalities: ["Mölndal", "Partille"],
      areas: [],
      max_price: 6_500_000,
      include_new_construction: true,
    }),
    "insert user 2's search",
  );

  const matched = check(
    await supabaseAdmin
      .from("user_listings")
      .select("listing_id, listings!inner(external_id)")
      .eq("user_id", user2)
      .order("listing_id"),
    "read user 2's matches",
  );
  const matchedNumbers = matched.map(
    (m) => (m.listings as unknown as { external_id: number }).external_id,
  );
  if (matchedNumbers.length < 12) {
    fail(
      `User 2 only matched ${matchedNumbers.length} listings, expected at least 12`,
    );
  }

  // The first 6 matches are liked, the next 4 are seen but not liked, the rest stay "new"
  const liked = matchedNumbers.slice(0, 6);
  const seen = matchedNumbers.slice(6, 10);

  ok(
    await supabaseAdmin
      .from("user_listings")
      .update({ liked: true, is_new: false })
      .eq("user_id", user2)
      .in("listing_id", liked.map(idOf)),
    "like listings for user 2",
  );
  ok(
    await supabaseAdmin
      .from("user_listings")
      .update({ is_new: false })
      .eq("user_id", user2)
      .in("listing_id", seen.map(idOf)),
    "mark listings seen for user 2",
  );

  // Removed listings never match, but liked ones stay in the list as "Hittas inte"
  ok(
    await supabaseAdmin.from("user_listings").insert(
      [...REMOVED].map((n) => ({
        user_id: user2,
        listing_id: idOf(n),
        liked: true,
        is_new: false,
      })),
    ),
    "insert user 2's removed likes",
  );

  return { matchedCount: matchedNumbers.length, liked };
}
