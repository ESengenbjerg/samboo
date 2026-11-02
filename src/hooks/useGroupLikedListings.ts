import { getGroupMembers } from "@/services/groups";
import { getLikedListingsForUsers } from "@/services/listings";
import { GroupMember } from "@/types/connected-accounts";
import { Listing } from "@/types/listing";
import { useEffect, useState } from "react";

// One group member and the listings they have liked
export type MemberLikedList = {
  member: GroupMember;
  listings: Listing[];
};

type GroupLikedListingsResult = {
  userId: string;
  lists: MemberLikedList[];
  failed?: boolean;
};

// The liked listings of the other members of my group, one list per member.
// Empty if I am not in a group. Pass undefined until the session is loaded
export function useGroupLikedListings(userId: string | undefined) {
  const [result, setResult] = useState<GroupLikedListingsResult | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Ignore the response if the user changed or the component unmounted
    let cancelled = false;

    async function load(id: string) {
      const membersResult = await getGroupMembers(id);
      if (cancelled) return;
      if (membersResult.error) {
        console.error("Failed to load group members: ", membersResult.error);
        setResult({ userId: id, lists: [], failed: true });
        return;
      }

      const members = membersResult.data ?? [];
      // Not in a group, nothing more to fetch
      if (members.length === 0) {
        setResult({ userId: id, lists: [] });
        return;
      }

      // One request for all members, then split the rows per member
      const { data, error } = await getLikedListingsForUsers(
        members.map((m) => m.id),
      );
      if (cancelled) return;
      if (error) {
        console.error("Failed to load group liked listings: ", error);
        setResult({ userId: id, lists: [], failed: true });
        return;
      }

      const lists = members.map((member) => ({
        member,
        listings: data
          .filter((row) => row.user_id === member.id)
          .map((row) => row.listings),
      }));
      setResult({ userId: id, lists });
    }

    load(userId);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    lists: current?.lists ?? [],
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta gruppens listor." : null,
  };
}
