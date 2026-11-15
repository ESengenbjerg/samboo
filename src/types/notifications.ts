import { GroupMember, InviteStatus } from "@/types/connected-accounts";
import type { RpcRow } from "@shared/db";

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

// An invite I have sent that the recipient has accepted or declined
export type AnsweredInvite = {
  id: number;
  status: Extract<InviteStatus, "accepted" | "declined">;
  // When the recipient answered
  responded_at: string;
  to_email: string;
  // The recipient's name if they are in my group now (accepted), otherwise null:
  // the name of someone outside my group can not be read
  name: string | null;
};

// The answered invites split into the sections of the notifications page
export type AnsweredInvitesByDay = Record<NotificationDay, AnsweredInvite[]>;

// A change another member made to one of my group's showings, from my_showing_events().
// actor_id is the member who made the change (never me). showing_date is the date after the change
// (before it for deleted). is_unseen: newer than the last time I left the notifications page.
// address and start_time can be null (no address / no start time)
export type ShowingEvent = RpcRow<"my_showing_events", "address" | "start_time">;

// The showing events split into the sections of the notifications page
export type ShowingEventsByDay = Record<NotificationDay, ShowingEvent[]>;
