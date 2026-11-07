import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useState } from "react";

type Answer = "accepted" | "declined";

// Answers a received invite and remembers the answer so the UI can confirm it.
// Shared by the settings page and the notifications page
export function useAnswerInvite(accounts: ConnectedAccounts) {
  const { acceptInvite, declineInvite, receivedInvites } = accounts;
  const [answeredInvite, setAnsweredInvite] = useState<Answer | null>(null);
  // The sender's name, saved when answering: after the answer the invites are reloaded
  // and the answered invite is no longer in receivedInvites
  const [answeredFromName, setAnsweredFromName] = useState<string | null>(null);

  // Only show the confirmation if the database call succeeded
  async function onAnswer(inviteId: number, answer: Answer) {
    // Read the name before answering, while the invite is still in the list
    const fromName =
      receivedInvites.find((i) => i.id === inviteId)?.from_name ?? null;

    const ok =
      answer === "accepted"
        ? await acceptInvite(inviteId)
        : await declineInvite(inviteId);
    if (ok) {
      setAnsweredInvite(answer);
      setAnsweredFromName(fromName);
    }
  }

  return { answeredInvite, answeredFromName, onAnswer };
}
