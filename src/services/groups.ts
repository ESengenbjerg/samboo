import { supabase } from "@/lib/supabase";
import { GroupMember } from "@/types/connected-accounts";

type MemberRow = {
  id: string;
  name: string;
  avatar_path: string | null;
};

// profiles.avatar_path is a path in the public 'avatars' bucket
function avatarUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

// The other members of my group (connected accounts). Empty if I am not in a group
export async function getGroupMembers(userId: string) {
  // GET: the function is read-only (STABLE). A POST would make check_request() try to write
  // the rate limit counter inside a read-only transaction, which fails
  const { data: groupId, error: groupError } = await supabase.rpc(
    "my_group_id",
    undefined,
    { get: true },
  );
  if (groupError) return { data: null, error: groupError };
  if (groupId === null) return { data: [] as GroupMember[], error: null };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_path")
    .eq("group_id", groupId)
    .neq("id", userId)
    .order("name")
    .overrideTypes<MemberRow[]>();
  if (error) return { data: null, error };

  const members: GroupMember[] = data.map((m) => ({
    id: m.id,
    name: m.name,
    avatarUrl: avatarUrl(m.avatar_path),
  }));
  return { data: members, error: null };
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
