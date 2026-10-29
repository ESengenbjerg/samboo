import { supabase } from "@/lib/supabase";
import { ReceivedInvite, SentInvite } from "@/types/connected-accounts";
import type { PostgrestError } from "@supabase/supabase-js";

// The database compares e-mails case-insensitively, but store them clean anyway
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createInvite(fromUserId: string, toEmail: string) {
  return supabase
    .from("invites")
    .insert({ from_user_id: fromUserId, to_email: normalizeEmail(toEmail) });
}

// Invites I have sent, newest first. Includes declined/accepted so the sender can see the answer
export function getSentInvites(userId: string) {
  return supabase
    .from("invites")
    .select("id, created_at, to_email, status, responded_at")
    .eq("from_user_id", userId)
    .order("created_at", { ascending: false })
    .overrideTypes<SentInvite[]>();
}

// Pending invites addressed to my e-mail, with the sender's name and e-mail.
// Uses a function because the recipient cannot read the sender's profile
export async function getReceivedInvites() {
  // GET: read-only function, see getGroupMembers() in groups.ts
  const { data, error } = await supabase.rpc("my_pending_invites", undefined, {
    get: true,
  });
  return { data: data as ReceivedInvite[] | null, error };
}

// Joins the sender's group. Fails if I am already in a group or the group is full.
// A pending invite from me to the sender is cancelled by the database
export function acceptInvite(inviteId: number) {
  return supabase.rpc("accept_invite", { invite_id: inviteId });
}

export function declineInvite(inviteId: number) {
  return supabase.rpc("decline_invite", { invite_id: inviteId });
}

// The sender withdraws a pending invite (e.g. wrong e-mail address)
export function cancelInvite(inviteId: number) {
  return supabase.rpc("cancel_invite", { invite_id: inviteId });
}

// Turns a database error from the invite/group flow into a message for the user
export function inviteErrorMessage(error: PostgrestError) {
  switch (error.code) {
    // raise exception in the database functions/triggers. The messages are already written in Swedish
    case "P0001":
      return error.message;
    // invites_one_pending: a pending invite to this e-mail already exists
    case "23505":
      return "Du har redan en väntande inbjudan till den här e-postadressen.";
    // invites_insert policy: most likely my own e-mail
    case "42501":
      return "Du kan inte bjuda in dig själv.";
    // invites_email_length
    case "23514":
      return "E-postadressen är för lång.";
    // check_request() rate limit
    case "rate_limited":
      return "Du har gjort för många ändringar. Vänta en stund och försök igen.";
    default:
      return "Något gick fel, försök igen.";
  }
}
