import { Listing } from "@/types/listing";

export type ScheduledShowings = {
  id: number;
  address: string;
  municipality: string;
  area: string;
  startsAt: Date;
};

// A row from showings joined with its listing
export type ShowingRow = {
  id: number;
  listing_id: number;
  // "2026-10-29"
  showing_date: string;
  // "11:00:00", null if no start time was entered
  start_time: string | null;
  note: string | null;
  listings: Pick<Listing, "municipality" | "area" | "ld_json">;
};

// What the app sends when saving a showing. The owner (group_id, or user_id if I have
// no group) is filled in by the database
export type NewShowing = {
  listingId: number;
  // "2026-10-29"
  date: string;
  // "11:00", null if no start time
  startTime: string | null;
  note: string | null;
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
