import { supabase } from "@/lib/supabase";
import { ShowingEvent } from "@/types/notifications";

// Showings created, changed or deleted by the other members of my group in the last
// 30 days, newest first (max 100). Never my own changes. Empty if I have no group.
// STABLE function: must be called with GET (see docs/database-design.md)
export async function getShowingEvents() {
  const { data, error } = await supabase.rpc("my_showing_events", undefined, {
    get: true,
  });
  // ShowingEvent marks address and start_time as nullable, which the generated type does not know
  const events: ShowingEvent[] = data ?? [];
  return { data: events, error };
}

// true if something has happened since I last left the notifications page: an invite,
// an answer to my invite, a new match, a group like that is new to me, or a showing change.
// For the dot on the bell. STABLE function: must be called with GET
export async function hasNewNotifications() {
  const { data, error } = await supabase.rpc(
    "has_new_notifications",
    undefined,
    { get: true },
  );
  return { data: data === true, error };
}

// Sets my notifications_seen_at to now: has_new_notifications() becomes false and every
// is_unseen in my_showing_events() becomes false. Call it when leaving the notifications page
export function markNotificationsSeen() {
  return supabase.rpc("mark_notifications_seen");
}
