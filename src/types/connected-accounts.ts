import type { Enums, Tables } from "@shared/database.types";
import type { RpcRow } from "@shared/db";

// Same limit as accept_invite() in the database
export const MAX_GROUP_MEMBERS = 10;

// invites.status, the database enum public.invite_status
export type InviteStatus = Enums<"invite_status">;

// Another member of my group (a connected account)
export type GroupMember = {
  id: string;
  name: string;
  // From my_group_members(), the e-mail is only in auth.users
  email: string;
  // Public URL built from profiles.avatar_path, null if no image
  avatarUrl: string | null;
};

// Invite addressed to me, from my_pending_invites()
export type ReceivedInvite = RpcRow<"my_pending_invites">;

// Invite I have sent (all statuses)
export type SentInvite = Pick<
  Tables<"invites">,
  "id" | "created_at" | "to_email" | "status" | "responded_at"
>;
