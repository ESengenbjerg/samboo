import { InviteStatus } from "@/types/connected-accounts";
import { create } from "zustand";

export type Answer = Extract<InviteStatus, "accepted" | "declined">;

type AnsweredInviteState = {
  answer: Answer | null;
  // The sender's name, saved when answering: after the answer the invites are reloaded
  // and the answered invite is no longer in receivedInvites
  fromName: string | null;
  set: (answer: Answer, fromName: string | null) => void;
  clear: () => void;
};

// The confirmation of an invite I answered. A store, because the invite can be answered
// on the settings page while the confirmation belongs on the notifications page
export const useAnsweredInviteStore = create<AnsweredInviteState>((set) => ({
  answer: null,
  fromName: null,
  set: (answer, fromName) => set({ answer, fromName }),
  clear: () => set({ answer: null, fromName: null }),
}));
