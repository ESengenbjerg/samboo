import { supabase } from "@/lib/supabase";
import { SkippedShowing } from "@/types/showings";
import { isValidEmail, normalizeEmail } from "@shared/email";
import { commonErrorMessage } from "@/utils/error-message/common-messages";
import type { PostgrestError } from "@supabase/supabase-js";

// ownEmail is optional. If given, inviting yourself is stopped before anything is saved
export function validateInviteEmails(
  emails: string[],
  ownEmail?: string | null,
): string | null {
  if (emails.length === 0) return "Ange minst en mejladress.";
  const invalid = emails.find((e) => !isValidEmail(e));
  if (invalid) return `Ogiltig mejladress: ${invalid}`;
  if (ownEmail) {
    const own = normalizeEmail(ownEmail);
    if (emails.some((e) => normalizeEmail(e) === own)) {
      return "Du kan inte bjuda in dig själv.";
    }
  }
  return null;
}

export const SEND_INVITE_FALLBACK = "Kunde inte skicka inbjudan. Försök igen.";

export type InviteFailure = { email: string; message: string };

// One message for the invites that failed, so the user knows which address caused what.
// Used when some or all invites in a batch were rejected
export function inviteFailureSummary(failures: InviteFailure[], total: number) {
  if (failures.length === 1 && total === 1) {
    return `${failures[0].email}: ${failures[0].message}`;
  }
  const details = failures.map((f) => `${f.email}: ${f.message}`).join(" ");
  const sent = total - failures.length;
  return sent > 0
    ? `${sent} av ${total} inbjudningar skickades. ${details}`
    : details;
}

export function createInvite(fromUserId: string, toEmail: string) {
  // The database compares e-mails case-insensitively, but store them clean anyway
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
    .order("created_at", { ascending: false });
}

// Pending invites addressed to my e-mail, with the sender's name and e-mail.
// Uses a function because the recipient cannot read the sender's profile
export async function getReceivedInvites() {
  // GET: read-only function, see getGroupMembers() in groups.ts
  const { data, error } = await supabase.rpc("my_pending_invites", undefined, {
    get: true,
  });
  return { data, error };
}

// Joins the sender's group. Fails if I am already in a group or the group is full.
// A pending invite from me to the sender is cancelled by the database
export async function acceptInvite(inviteId: number) {
  const { data, error } = await supabase.rpc("accept_invite", {
    invite_id: inviteId,
  });
  // The visits that did not follow into the group (empty if none)
  const skipped: SkippedShowing[] = Array.isArray(data)
    ? (data as unknown as SkippedShowing[])
    : [];
  return { data: skipped, error };
}

export function declineInvite(inviteId: number) {
  return supabase.rpc("decline_invite", { invite_id: inviteId });
}

// The sender withdraws a pending invite (e.g. wrong e-mail address)
export function cancelInvite(inviteId: number) {
  return supabase.rpc("cancel_invite", { invite_id: inviteId });
}

// Turns a database error from the invite/group flow into a message for the user
// fallback is for errors without a known code, and should say what the user tried to do
export function inviteErrorMessage(
  error: PostgrestError,
  fallback = "Något gick fel, försök igen.",
) {
  switch (error.code) {
    // raise exception in the database functions/triggers. The messages are already written in Swedish
    case "P0001":
      return error.message;
    // invites_one_pending: a pending invite to this e-mail already exists
    case "23505":
      return "Du har redan en väntande inbjudan till den här mejladressen.";
    // invites_insert policy: most likely my own e-mail
    case "42501":
      return "Du kan inte bjuda in dig själv.";
    // invites_email_length
    case "23514":
      return "Mejladressen är för lång.";
    // check_request() rate limit
    default:
      // Offline and rate limit (rate_limited) get their own text
      return commonErrorMessage(error, fallback);
  }
}
