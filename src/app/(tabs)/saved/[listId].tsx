import ListingsFeed from "@/components/listings-feed";
import { useLikedListings } from "@/hooks/useLikedListings";
import { useSession } from "@/hooks/useSession";
import { useSharedLikedListings } from "@/hooks/useSharedLikedListings";
import { useLocalSearchParams } from "expo-router";
import { use } from "react";

export default function SavedListScreen() {
  const { listId, title } = useLocalSearchParams<{
    listId: string;
    title?: string;
  }>();
  const { session } = useSession();
  const userId = session?.user.id;

  // "Mine" = my list, otherwise listId = group members id
  const likedUserId = listId === "mine" ? userId : listId;
  const isShared = listId === "shared";

  // Call hooks
  const liked = useLikedListings(isShared ? undefined : likedUserId);
  const shared = useSharedLikedListings(isShared ? userId : undefined);

  // Use result from hooks
  const { listings, isLoading, error } = isShared ? shared : liked;

  return (
    <ListingsFeed
      title={title ?? "Lista"}
      listings={listings}
      isLoading={isLoading}
      error={error}
      path={"/saved/object/[id]"}
    />
  );
}
