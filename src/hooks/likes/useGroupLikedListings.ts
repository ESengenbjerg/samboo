import { getGroupMembers } from "@/services/groups";
import { getLikedListingsForUsers } from "@/services/listings";
import { GroupMember } from "@/types/connected-accounts";
import { MemberLikedListing } from "@/types/listing";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

// One group member and the listings they have liked, with when they liked them
export type MemberLikedList = {
  member: GroupMember;
  listings: MemberLikedListing[];
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
  // true while the fetch of this visit is running. result still holds the previous visit's
  // data meanwhile, so isLoading alone can not tell if the data is up to date
  const [isFetching, setIsFetching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the component unmounted
      let cancelled = false;

      async function load(id: string) {
        setIsFetching(true);

        const membersResult = await getGroupMembers();

        if (cancelled) return;
        if (membersResult.error) {
          console.error("Failed to load group members: ", membersResult.error);
          setIsFetching(false);
          setResult({ userId: id, lists: [], failed: true });
          return;
        }

        const members = membersResult.data ?? [];
        // Not in a group, nothing more to fetch
        if (members.length === 0) {
          setIsFetching(false);
          setResult({ userId: id, lists: [] });
          return;
        }

        // One request for all members, then split the rows per member
        const { data, error } = await getLikedListingsForUsers(
          members.map((m) => m.id),
        );
        if (cancelled) return;
        setIsFetching(false);

        if (error) {
          console.error("Failed to load group liked listings: ", error);
          setResult({ userId: id, lists: [], failed: true });
          return;
        }

        const lists = members.map((member) => ({
          member,
          listings: data
            .filter((row) => row.user_id === member.id)
            .map((row) => ({ ...row.listings, liked_at: row.liked_at })),
        }));
        setResult({ userId: id, lists });
      }

      load(userId);
      return () => {
        cancelled = true;
      };
    }, [userId]),
  );

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    lists: current?.lists ?? [],
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    // true when this visit's fetch has finished successfully
    isReady: !!current && !current.failed && !isFetching,
    error: current?.failed ? "Kunde inte hämta gruppens listor." : null,
  };
}
