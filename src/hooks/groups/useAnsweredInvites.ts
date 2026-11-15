import { ConnectedAccounts } from "@/hooks/groups/useConnectedAccounts";
import { AnsweredInvite, AnsweredInvitesByDay } from "@/types/notifications";
import { startOfToday } from "@/utils/date-format";
import { toNotificationDay } from "@/utils/notification-day";
import { sameEmail } from "@shared/email";
import { useMemo } from "react";

// Invites are kept for a year, but an answer is only news for a while.
// Same limit as the showing events (showing_events are deleted after 30 days)
const MAX_AGE_DAYS = 30;

// Answers (accepted or declined) to the invites I have sent, in the last 30 days, split into
// today / yesterday / earlier by when they were answered. Newest first within each day.
// Takes the accounts from useConnectedAccounts() instead of calling it again, so the page
// does not fetch the invites twice or open a second realtime subscription
export function useAnsweredInvites(accounts: ConnectedAccounts) {
  const { sentInvites, members } = accounts;

  const answeredByDay = useMemo(() => {
    const byDay: AnsweredInvitesByDay = {
      today: [],
      yesterday: [],
      earlier: [],
    };
    // Midnight 30 days ago, local time
    const oldestDate = startOfToday();
    oldestDate.setDate(oldestDate.getDate() - MAX_AGE_DAYS);
    const oldest = oldestDate.getTime();

    const answered: AnsweredInvite[] = [];
    for (const invite of sentInvites) {
      // Pending and cancelled (withdrawn by me) are not answers
      if (invite.status !== "accepted" && invite.status !== "declined")
        continue;
      if (!invite.responded_at) continue;
      if (new Date(invite.responded_at).getTime() < oldest) continue;

      // An accepted invite means the recipient is in my group now, so the name can be found.
      // to_email is stored normalized, the member's e-mail may not be
      const member = members.find((m) => sameEmail(m.email, invite.to_email));

      answered.push({
        id: invite.id,
        status: invite.status,
        responded_at: invite.responded_at,
        to_email: invite.to_email,
        name: member?.name ?? null,
      });
    }

    // Newest answer first
    answered.sort(
      (a, b) =>
        new Date(b.responded_at).getTime() - new Date(a.responded_at).getTime(),
    );

    for (const invite of answered) {
      byDay[toNotificationDay(invite.responded_at)].push(invite);
    }
    return byDay;
  }, [sentInvites, members]);

  return { answeredByDay };
}
