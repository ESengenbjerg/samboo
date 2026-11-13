import { ConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { Answer, useAnsweredInviteStore } from "@/stores/answered-invite";

// Answers a received invite and remembers the answer so the UI can confirm it.
// Shared by the settings page and the notifications page
export function useAnswerInvite(accounts: ConnectedAccounts) {
  const { acceptInvite, declineInvite, receivedInvites } = accounts;
  const answeredInvite = useAnsweredInviteStore((s) => s.answer);
  const answeredFromName = useAnsweredInviteStore((s) => s.fromName);
  const setAnswer = useAnsweredInviteStore((s) => s.set);
  const clearAnswer = useAnsweredInviteStore((s) => s.clear);

  // Only show the confirmation if the database call succeeded
  async function onAnswer(inviteId: number, answer: Answer) {
    // Read the name before answering, while the invite is still in the list
    const fromName =
      receivedInvites.find((i) => i.id === inviteId)?.from_name ?? null;

    const ok =
      answer === "accepted"
        ? await acceptInvite(inviteId)
        : await declineInvite(inviteId);
    if (ok) setAnswer(answer, fromName);
    return ok;
  }

  return { answeredInvite, answeredFromName, onAnswer, clearAnswer };
}
