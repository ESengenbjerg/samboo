import { supabase } from "@/lib/supabase";
import { NewShowing, ShowingRow } from "@/types/showings";
import { toIsoDate } from "@/utils/date-format";
import type { PostgrestError } from "@supabase/supabase-js";

// The listings_select_showings policy lets me read every listing I have a showing for.
// !inner is a safety net: without it listings could be null and the app would crash
const SHOWING_COLUMNS =
  "id, listing_id, showing_date, start_time, note, listings!inner(municipality, area, ld_json)";

// Today's date in local time as "2026-10-29", to compare with showings.showing_date
function today() {
  return toIsoDate(new Date());
}

// My showings from today and forward, soonest first.
// RLS returns my group's showings, or my own if I am not in a group
export function getUpcomingShowings() {
  return supabase
    .from("showings")
    .select(SHOWING_COLUMNS)
    .gte("showing_date", today())
    .order("showing_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: false })
    .overrideTypes<ShowingRow[]>();
}

// My showings (group's or own, see getUpcomingShowings()) before today, latest first.
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

// The owner is not sent: the database sets group_id to my group, or user_id to me if
// I am not in a group (column defaults). At most 50 showings per owner
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
    // raise exception in limit_showings_per_group(): max 50 showings.
    // The message is already written in Swedish
    case "P0001":
      return error.message;
    // showings_group_listing_unique / showings_user_listing_unique:
    // there is already a showing for this listing
    case "23505":
      return "Det finns redan en sparad visning för den här bostaden.";
    // showings_insert policy: the listing is not visible to me (or my account is not active)
    case "42501":
      return "Du kan inte spara en visning för den här bostaden.";
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
