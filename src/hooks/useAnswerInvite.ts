import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useState } from "react";

type Answer = "accepted" | "declined";

// Answers a received invite and remembers the answer so the UI can confirm it.
// Shared by the settings page and the notifications page
export function useAnswerInvite(accounts: ConnectedAccounts) {
  const { acceptInvite, declineInvite } = accounts;
  const [answeredInvite, setAnsweredInvite] = useState<Answer | null>(null);

  // Only show the confirmation if the database call succeeded
  async function onAnswer(inviteId: number, answer: Answer) {
    const ok =
      answer === "accepted"
        ? await acceptInvite(inviteId)
        : await declineInvite(inviteId);
    if (ok) setAnsweredInvite(answer);
  }

  return { answeredInvite, onAnswer };
}
