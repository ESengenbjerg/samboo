import { Listing } from "@/types/listing";
import type { Tables } from "@shared/database.types";

export type ScheduledShowing = {
  id: number;
  listingId: number;
  address: string;
  municipality: string;
  area: string;
  startsAt: Date;
  note: string | null;
};

// A row from showings joined with its listing.
// showing_date "2026-10-29", start_time "11:00:00" or null if no start time was entered
export type ShowingRow = Pick<
  Tables<"showings">,
  "id" | "listing_id" | "showing_date" | "start_time" | "note"
> & {
  listings: Pick<Listing, "address" | "municipality" | "area">;
};

// What the app sends when saving a showing. The owner (group_id, or user_id if I have
// no group) is filled in by the database
export type NewShowing = {
  listingId: number;
  // "2026-10-29"
  date: string;
  // "11:00"
  startTime: string;
  note: string | null;
};

export type ShowingValues = {
  date: string;
  time: string;
  note: string;
};

// One of my own showings that did not follow into the group when I accepted an invite,
// because the group already had a showing for the same listing. From accept_invite()
export type SkippedShowing = {
  // Street address, or area/municipality if the listing has none
  address: string | null;
  // The listing on the agency's site
  url: string;
  // "2026-10-29"
  showing_date: string;
  // "11:00:00", null if no start time
  start_time: string | null;
};
