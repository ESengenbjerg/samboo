import { GroupMember } from "@/types/connected-accounts";

// The sections of the notifications page
export type NotificationDay = "today" | "yesterday" | "earlier";

// A group member who has liked listings that I have not opened yet
export type MemberUpdate = {
  member: GroupMember;
  // How many of the member's liked listings are new to me
  newCount: number;
  // When the member liked the latest of them. null if none of them has a liked_at
  latestLikedAt: string | null;
};

// The member updates split into the sections of the notifications page
export type MemberUpdatesByDay = Record<NotificationDay, MemberUpdate[]>;
