// Two personal showings for user 2 on liked listings.
// User 2 has no group yet, so they move into the group when user 1 accepts the invite.
import { supabaseAdmin } from "../../../lib/supabaseAdmin.ts";
import { DAY, ok, type IdOf } from "../setup/helpers.ts";

export async function createFriendShowings(
  user2: string,
  liked: number[],
  idOf: IdOf,
  now: number,
): Promise<void> {
  // In the future, so purge_old_showings() (30 days after the date) leaves them alone
  const dateIn = (days: number) =>
    new Date(now + days * DAY).toISOString().slice(0, 10);
  ok(
    await supabaseAdmin.from("showings").insert([
      {
        user_id: user2,
        group_id: null,
        listing_id: idOf(liked[0]),
        showing_date: dateIn(5),
        start_time: "17:30",
        note: "Ta med frågor om avgiften",
      },
      {
        user_id: user2,
        group_id: null,
        listing_id: idOf(liked[1]),
        showing_date: dateIn(9),
        start_time: "12:00",
        note: null,
      },
    ]),
    "insert user 2's showings",
  );
}
