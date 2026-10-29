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

// What the app sends when saving a showing. group_id is filled in by the database
export type NewShowing = {
  listingId: number;
  // "2026-10-29"
  date: string;
  // "11:00", null if no start time
  startTime: string | null;
  note: string | null;
};
