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

// An invite I have sent that the recipient has accepted or declined
export type AnsweredInvite = {
  id: number;
  status: "accepted" | "declined";
  // When the recipient answered
  responded_at: string;
  to_email: string;
  // The recipient's name if they are in my group now (accepted), otherwise null:
  // the name of someone outside my group can not be read
  name: string | null;
};

// The answered invites split into the sections of the notifications page
export type AnsweredInvitesByDay = Record<NotificationDay, AnsweredInvite[]>;

export type ShowingEventAction = "created" | "updated" | "deleted";

// A change another member made to one of my group's showings, from my_showing_events()
export type ShowingEvent = {
  id: number;
  // When the change was made
  created_at: string;
  action: ShowingEventAction;
  // The member who made the change (never me)
  actor_id: string;
  actor_name: string;
  listing_id: number;
  address: string | null;
  // "2026-10-29". The date after the change (before it for deleted)
  showing_date: string;
  // "17:30:00", null if no start time
  start_time: string | null;
  // Newer than the last time I left the notifications page
  is_unseen: boolean;
};

// The showing events split into the sections of the notifications page
export type ShowingEventsByDay = Record<NotificationDay, ShowingEvent[]>;
