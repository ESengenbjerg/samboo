import ListingsFeed from "@/components/listings-feed";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useSavedList } from "@/hooks/useSavedList";
import { useSession } from "@/hooks/useSession";
import { router, useLocalSearchParams } from "expo-router";

export default function SavedListScreen() {
  const { listId, title } = useLocalSearchParams<{
    listId: string;
    title?: string;
  }>();
  const { session } = useSession();
  const { listings, isLoading, error } = useSavedList(listId, session?.user.id);

  return (
    <>
      <Button
        variant="link"
        onPress={() => router.back()}
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
