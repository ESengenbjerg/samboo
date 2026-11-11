// Three personal showings for user 2 on liked listings.
// User 2 has no group yet, so they move into the group when user 1 accepts the invite.
import { supabaseAdmin } from "../../../lib/supabaseAdmin.ts";
import { ok, type IdOf } from "../setup/helpers.ts";

export async function createFriendShowings(
  user2: string,
  liked: number[],
  idOf: IdOf,
  _now: number,
): Promise<void> {
  // purge_old_showings() removes showings 30 days after their date, so the first goes on 16 Dec 2026.
  ok(
    await supabaseAdmin.from("showings").insert([
      {
        user_id: user2,
        group_id: null,
        listing_id: idOf(liked[0]),
        showing_date: "2026-11-16",
        start_time: "17:30",
        note: "Fin lägenhet med bra ljus. Avgiften var rimlig och föreningen verkade ha god ekonomi. Köket är något slitet, annars i bra skick.",
      },
      {
        user_id: user2,
        group_id: null,
        listing_id: idOf(liked[1]),
        showing_date: "2026-11-25",
        start_time: "12:00",
        note: "Ta med frågor om avgiften",
      },
      {
        user_id: user2,
        group_id: null,
        listing_id: idOf(liked[2]),
        showing_date: "2026-12-07",
        start_time: "16:00",
        note: null,
      },
    ]),
    "insert user 2's showings",
  );
}
