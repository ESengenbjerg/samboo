import ListButton from "@/components/saved/list-button";
import { Text } from "@/components/ui/text";
import { useGroupLikedListings } from "@/hooks/useGroupLikedListings";
import { useLikedListings } from "@/hooks/useLikedListings";
import { useSession } from "@/hooks/useSession";
import { View } from "react-native";

export default function SavedScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { listings, isLoading, error } = useLikedListings(userId);
  const {
    lists: memberLists,
    isLoading: isLoadingGroup,
    error: groupError,
  } = useGroupLikedListings(userId);

  if (!userId) return null;

  return (
    <View className="flex-1 px-6 bg-background gap-8">
      <Text variant="h1">Mina listor</Text>

      {isLoading && <Text>Laddar...</Text>}
      {error && <Text>{error}</Text>}

      {!isLoading && !error && (
        <ListButton
          title={"Min"}
          listId={"mine"}
          numberOfSavedObjects={listings.length}
          firstObjectImage={listings[0]?.ld_json.image}
        />
      )}

      {isLoadingGroup && <Text>Laddar grupp...</Text>}
      {groupError && <Text>{groupError}</Text>}

      {memberLists.length !== 0 && (
        <>
          <Text>Grupp</Text>
          {memberLists.map((l) => (
            <ListButton
              key={l.member.id}
              title={l.member.name}
              listId={l.member.name}
              numberOfSavedObjects={l.listings.length}
              firstObjectImage={l.listings[0]?.ld_json.image}
            />
          ))}
        </>
      )}
    </View>
  );
}
