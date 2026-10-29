import { supabase } from "@/lib/supabase";
import { NewShowing, ShowingRow } from "@/types/showings";
import type { PostgrestError } from "@supabase/supabase-js";

// !inner skips showings whose listing I can no longer read (e.g. it was only matched to
// a member who has left the group). Without !inner listings is null and the app crashes
const SHOWING_COLUMNS =
  "id, listing_id, showing_date, start_time, note, listings!inner(municipality, area, ld_json)";

// Today's date in local time as "2026-10-29", to compare with showings.showing_date
function today() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// My group's showings from today and forward, soonest first.
// RLS only returns my group's rows. Empty if I am not in a group
export function getUpcomingShowings() {
  return supabase
    .from("showings")
    .select(SHOWING_COLUMNS)
    .gte("showing_date", today())
    .order("showing_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: false })
    .overrideTypes<ShowingRow[]>();
}

// My group's showings before today, latest first.
// The database deletes showings 30 days after their date
export function getPastShowings() {
  return supabase
    .from("showings")
    .select(SHOWING_COLUMNS)
    .lt("showing_date", today())
    .order("showing_date", { ascending: false })
    .order("start_time", { ascending: false, nullsFirst: false })
    .overrideTypes<ShowingRow[]>();
}

// group_id is not sent: the database fills it in from my group (column default my_group_id())
export function createShowing(showing: NewShowing) {
  return supabase.from("showings").insert({
    listing_id: showing.listingId,
    showing_date: showing.date,
    start_time: showing.startTime,
    note: showing.note,
  });
}

// Turns a database error from saving a showing into a message for the user
export function showingErrorMessage(error: PostgrestError) {
  switch (error.code) {
    // showings_group_listing_unique: the group already has a showing for this listing
    case "23505":
      return "Det finns redan en sparad visning för den här bostaden.";
    // showings_insert policy / group_id not null: I am not in a group
    case "42501":
    case "23502":
      return "Du behöver vara kopplad till ett annat konto för att spara visningar.";
    // showings_note_length
    case "23514":
      return "Anteckningen får vara max 500 tecken.";
    // Invalid date or time
    case "22007":
    case "22008":
      return "Ogiltigt datum eller tid.";
    // check_request() rate limit
    case "rate_limited":
      return "Du har gjort för många ändringar. Vänta en stund och försök igen.";
    default:
      return "Något gick fel, försök igen.";
  }
}
