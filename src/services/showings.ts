import { SHOWING_NOTE_MAX_LENGTH } from "@/constants/limits";
import { supabase } from "@/lib/supabase";
import { NewShowing, ShowingValues } from "@/types/showings";
import { toIsoDate } from "@/utils/date-format";
import { commonErrorMessage } from "@/utils/error-message/common-messages";
import type { PostgrestError } from "@supabase/supabase-js";

// The listings_select_showings policy lets me read every listing I have a showing for.
// !inner is a safety net: without it listings could be null and the app would crash
const SHOWING_COLUMNS =
  "id, listing_id, showing_date, start_time, note, listings!inner(address, municipality, area)";

export const NOTE_TOO_LONG_MESSAGE = `Anteckningen får vara max ${SHOWING_NOTE_MAX_LENGTH} tecken.`;

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
    .order("start_time", { ascending: true, nullsFirst: false });
}

// My showings (group's or own, see getUpcomingShowings()) before today, latest first.
// The database deletes showings 30 days after their date
export function getPastShowings() {
  return supabase
    .from("showings")
    .select(SHOWING_COLUMNS)
    .lt("showing_date", today())
    .order("showing_date", { ascending: false })
    .order("start_time", { ascending: false, nullsFirst: false });
}

// The showing for one listing, or null if there is none. RLS returns my group's
// showing, or my own if I am not in a group. There is at most one per listing
export function getShowingForListing(listingId: number) {
  return supabase
    .from("showings")
    .select(SHOWING_COLUMNS)
    .eq("listing_id", listingId)
    .limit(1)
    .maybeSingle();
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

// .select() returns the rows that were updated. An empty array means no row matched,
// i.e. the showing is gone (for example deleted by a group member)
export function updateShowing(id: number, showing: ShowingValues) {
  return supabase
    .from("showings")
    .update({
      showing_date: showing.date,
      start_time: showing.time,
      note: showing.note || null,
    })
    .eq("id", id)
    .select("id");
}

export function deleteShowing(id: number) {
  return supabase.from("showings").delete().eq("id", id);
}

// Calls onChange when a showing I can read is created, changed or deleted, e.g. when
// someone in my group saves, edits or deletes one.
// INSERT and UPDATE events only reach me if RLS lets me read the row. DELETE events
// can not be filtered by RLS, so I may be told about deletes in other groups. That
// is harmless, since onChange just fetches again.
// Requires showings to be in the supabase_realtime publication.
// Returns a function that stops listening
export function subscribeToShowings(onChange: () => void) {
  const channel = supabase
    // Unique name: several screens may listen at once, and a reused name returns the already subscribed channel
    .channel(`showings:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "showings" },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
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
    // showings_note_length or showings_date_range. The hooks check both before sending,
    // so this only shows if something got past them
    case "23514":
      return "Kontrollera datum och anteckning.";
    // Invalid date or time
    case "22007":
    case "22008":
      return "Ogiltigt datum eller tid.";
    // check_request() rate limit
    default:
      // Offline and rate limit (rate_limited) get their own text
      return commonErrorMessage(
        error,
        "Kunde inte spara visningen. Försök igen.",
      );
  }
}
