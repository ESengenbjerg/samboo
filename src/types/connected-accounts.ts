// Same limit as accept_invite() in the database
export const MAX_GROUP_MEMBERS = 10;

export type InviteStatus = "pending" | "accepted" | "declined" | "cancelled";

// Another member of my group (a connected account)
export type GroupMember = {
  id: string;
  name: string;
  // Public URL built from profiles.avatar_path, null if no image
  avatarUrl: string | null;
};

// Invite addressed to me, from my_pending_invites()
export type ReceivedInvite = {
  id: number;
  created_at: string;
  from_user_id: string;
  from_name: string;
  from_email: string;
};

// Invite I have sent (all statuses)
export type SentInvite = {
  id: number;
  created_at: string;
  to_email: string;
  status: InviteStatus;
  responded_at: string | null;
};
