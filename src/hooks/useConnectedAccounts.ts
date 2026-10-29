import {
  getGroupMembers,
  leaveGroup as leaveGroupRpc,
  removeGroupMember as removeGroupMemberRpc,
  subscribeToConnectedAccounts,
} from "@/services/groups";
import {
  acceptInvite as acceptInviteRpc,
  cancelInvite as cancelInviteRpc,
  createInvite,
  declineInvite as declineInviteRpc,
  getReceivedInvites,
  getSentInvites,
  inviteErrorMessage,
  normalizeEmail,
} from "@/services/invites";
import {
  GroupMember,
  MAX_GROUP_MEMBERS,
  ReceivedInvite,
  SentInvite,
} from "@/types/connected-accounts";
import type { PostgrestError } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type ConnectedAccountsData = {
  userId: string;
  members: GroupMember[];
  receivedInvites: ReceivedInvite[];
  sentInvites: SentInvite[];
  failed?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Connected accounts (my group), invites to me and invites I have sent.
// Pass undefined until the session is loaded
export function useConnectedAccounts(userId: string | undefined) {
  const [data, setData] = useState<ConnectedAccountsData | null>(null);
  // Changes when refresh() is called so the fetch runs again
  const [refreshCount, setRefreshCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Ignore the response if the user changed or the component unmounted
    let cancelled = false;

    Promise.all([
      getGroupMembers(userId),
      getReceivedInvites(),
      getSentInvites(userId),
    ]).then(([members, received, sent]) => {
      if (cancelled) return;

      const error = members.error ?? received.error ?? sent.error;
      if (error) {
        console.log("Connected accounts error:", error);
        setData({
          userId,
          members: [],
          receivedInvites: [],
          sentInvites: [],
          failed: true,
        });
        return;
      }

      setData({
        userId,
        members: members.data ?? [],
        receivedInvites: received.data ?? [],
        sentInvites: sent.data ?? [],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [userId, refreshCount]);

  const refresh = useCallback(() => setRefreshCount((c) => c + 1), []);

  // Reload when something changes on another account's device
  useEffect(() => {
    if (!userId) return;
    return subscribeToConnectedAccounts(userId, refresh);
  }, [userId, refresh]);

  // Never expose data that belongs to a previous user
  const current = userId && data?.userId === userId ? data : null;
  const members = current?.members ?? [];
  // A group always has at least 2 members, so any other member means I am in one
  const isInGroup = members.length > 0;

  // Runs one database call, shows a message on failure and reloads everything afterwards.
  // Returns true if it succeeded
  const run = useCallback(
    async (
      action: () => PromiseLike<{ error: PostgrestError | null }>,
      logLabel: string,
    ) => {
      setActionError(null);
      setIsSubmitting(true);

      const { error } = await action();
      setIsSubmitting(false);
      // Reload on failure too: the invite or group may have changed on the other side
      refresh();

      if (error) {
        console.log(`${logLabel} error:`, error);
        setActionError(inviteErrorMessage(error));
        return false;
      }
      return true;
    },
    [refresh],
  );

  const sendInvite = useCallback(
    async (email: string) => {
      if (!userId) return false;

      const toEmail = normalizeEmail(email);
      if (!EMAIL_PATTERN.test(toEmail)) {
        setActionError("Ange en giltig e-postadress.");
        return false;
      }

      // Me + the others. The invite would be stored but could never be accepted
      if (members.length + 1 >= MAX_GROUP_MEMBERS) {
        setActionError(`Gruppen är full (max ${MAX_GROUP_MEMBERS} medlemmar).`);
        return false;
      }

      return run(() => createInvite(userId, toEmail), "Send invite");
    },
    [userId, members.length, run],
  );

  const acceptInvite = useCallback(
    async (inviteId: number) => {
      // The database checks this too, but a clearer message helps
      if (isInGroup) {
        setActionError(
          "Du är redan kopplad till andra konton. Lämna gruppen först för att acceptera.",
        );
        return false;
      }
      return run(() => acceptInviteRpc(inviteId), "Accept invite");
    },
    [isInGroup, run],
  );

  const declineInvite = useCallback(
    (inviteId: number) =>
      run(() => declineInviteRpc(inviteId), "Decline invite"),
    [run],
  );

  const cancelInvite = useCallback(
    (inviteId: number) => run(() => cancelInviteRpc(inviteId), "Cancel invite"),
    [run],
  );

  // Removes one connected account from my group
  const removeMember = useCallback(
    (memberId: string) =>
      run(() => removeGroupMemberRpc(memberId), "Remove member"),
    [run],
  );

  // I leave the group. The others stay connected if at least two of them remain
  const leaveGroup = useCallback(
    () => run(() => leaveGroupRpc(), "Leave group"),
    [run],
  );

  const clearActionError = useCallback(() => setActionError(null), []);

  // Invites from someone already in my group can no longer be accepted, so hide them
  const memberIds = new Set(members.map((m) => m.id));
  const receivedInvites = (current?.receivedInvites ?? []).filter(
    (i) => !memberIds.has(i.from_user_id),
  );
  const sentInvites = current?.sentInvites ?? [];

  return {
    members,
    isInGroup,
    receivedInvites,
    sentInvites,
    pendingSentInvites: sentInvites.filter((i) => i.status === "pending"),
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta dina kopplade konton." : null,
    refresh,
    isSubmitting,
    actionError,
    clearActionError,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
    removeMember,
    leaveGroup,
  };
}

export type ConnectedAccounts = ReturnType<typeof useConnectedAccounts>;
