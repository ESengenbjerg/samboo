import type { Tables } from "@shared/database.types";
import type { RpcRow } from "@shared/db";

// Same limit as accept_invite() in the database
export const MAX_GROUP_MEMBERS = 10;

// Handwritten until invites.status becomes an enum (part 3 of #153)
export type InviteStatus = "pending" | "accepted" | "declined" | "cancelled";

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

// Invite I have sent (all statuses). status is text in the generated types until part 3 of #153
export type SentInvite = Omit<
  Pick<Tables<"invites">, "id" | "created_at" | "to_email" | "status" | "responded_at">,
  "status"
> & { status: InviteStatus };
