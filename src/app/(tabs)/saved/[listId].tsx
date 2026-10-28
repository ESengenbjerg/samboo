import ListingsFeed from "@/components/listings-feed";
import { Text } from "@/components/ui/text";
import { useLikedListings } from "@/hooks/useLikedListings";
import { useSession } from "@/hooks/useSession";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

export default function SavedListScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { session } = useSession();
  const userId = session?.user.id;

  const isMine = listId === "mine";

  const { listings, isLoading, error } = useLikedListings(
    isMine ? userId : undefined,
  );

  if (!isMine) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>Listan finns inte.</Text>
      </View>
    );
  }

  return (
    <ListingsFeed
      title={"TODO: Lägg till namn"}
      listings={listings}
      isLoading={isLoading}
      error={error}
      path={"/saved/object/[id]"}
    />
  );
}
