import { supabase } from "@/lib/supabase";
import { getAvatarUrl } from "@/services/profiles";
import { GroupMember } from "@/types/connected-accounts";

import type { RpcRow } from "@shared/db";

// avatar_path is null for a member without a profile image
type MemberRow = RpcRow<"my_group_members", "avatar_path">;

// The other members of my group (connected accounts), with e-mail. Empty if I am not in a group
export async function getGroupMembers() {
  // GET: the function is read-only (STABLE). A POST would make check_request() try to write
  // the rate limit counter inside a read-only transaction, which fails
  const { data, error } = await supabase.rpc("my_group_members", undefined, {
    get: true,
  });
  if (error) return { data: null, error };

  const rows: MemberRow[] = data;
  const members: GroupMember[] = rows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    avatarUrl: getAvatarUrl(m.avatar_path),
  }));
  return { data: members, error: null };
}

// Calls onChange when an invite or a profile I can read changes, e.g. when someone
// accepts or declines my invite, invites me, or joins my group.
// Realtime only sends rows that RLS lets me read, so no filter is needed.
// Requires invites and profiles to be in the supabase_realtime publication.
// Returns a function that stops listening
export function subscribeToConnectedAccounts(
  userId: string,
  onChange: () => void,
) {
  const channel = supabase
    // Unique name: several screens may listen at once, and a reused name returns the already subscribed channel
    .channel(
      `connected-accounts:${userId}:${Math.random().toString(36).slice(2)}`,
    )

    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "invites" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles" },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Leaves my group. If only one member remains, the database dissolves the group
export function leaveGroup() {
  return supabase.rpc("leave_group");
}

// Removes another member from my group. Any member may remove any other member.
// If only one member remains, the database dissolves the group
export function removeGroupMember(memberId: string) {
  return supabase.rpc("remove_group_member", { target: memberId });
}
