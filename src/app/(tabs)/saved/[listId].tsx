import ListingsFeed from "@/components/listings-feed";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useLikedListings } from "@/hooks/useLikedListings";
import { useSession } from "@/hooks/useSession";
import { useSharedLikedListings } from "@/hooks/useSharedLikedListings";
import { router, useLocalSearchParams } from "expo-router";

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
    <>
      <Button
        variant="link"
        onPress={() => router.push("/(tabs)/saved")}
        className="px-6 justify-start bg-background"
      >
        <Text>Tillbaka</Text>
      </Button>
      <ListingsFeed
        title={title ?? "Lista"}
        listings={listings}
        isLoading={isLoading}
        error={error}
        path={"/saved/object/[id]"}
      />
    </>
  );
}
