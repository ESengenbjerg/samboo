import ListButton from "@/components/saved/list-button";
import { Text } from "@/components/ui/text";
import { MY_LIST_ID, SHARED_LIST_ID } from "@/constants/saved-lists";
import { useGroupLikedListings } from "@/hooks/useGroupLikedListings";
import { useLikedListings } from "@/hooks/useLikedListings";
import { useSharedLikedListings } from "@/hooks/useSharedLikedListings";
import { nameEndsWithS } from "@/utils/name-ends-with-s";
import { View } from "react-native";

export default function SavedListSection({ userId }: { userId: string }) {
  const { listings, isLoading, error } = useLikedListings(userId);
  const {
    lists: memberLists,
    isLoading: isLoadingGroup,
    error: groupError,
  } = useGroupLikedListings(userId);
  const {
    listings: sharedListings,
    isLoading: isLoadingShared,
    error: sharedError,
  } = useSharedLikedListings(userId);

  return (
    <View>
      <Text variant="h1" className="mb-8">
        Mina listor
      </Text>
      {/* List container */}
      <View className="gap-4">
        {isLoadingShared && <Text>Laddar gemensam lista...</Text>}
        {sharedError && <Text>{sharedError}</Text>}

        {/*  Shared list */}
        {!isLoadingShared && !sharedError && sharedListings.length !== 0 && (
          <ListButton
            title={"Gemensam"}
            listId={SHARED_LIST_ID}
            numberOfSavedObjects={sharedListings.length}
            firstObjectImage={sharedListings[0]?.ld_json.image}
          />
        )}

        {isLoading && <Text>Laddar...</Text>}
        {error && <Text>{error}</Text>}

        {/* My list */}
        {!isLoading && !error && (
          <ListButton
            title={"Min"}
            listId={MY_LIST_ID}
            numberOfSavedObjects={listings.length}
            firstObjectImage={listings[0]?.ld_json.image}
          />
        )}

        {isLoadingGroup && <Text>Laddar grupp...</Text>}
        {groupError && <Text>{groupError}</Text>}

        {/* Group members lists */}
        {!isLoadingGroup &&
          !groupError &&
          memberLists.map((l) => (
            <ListButton
              key={l.member.id}
              title={nameEndsWithS(l.member.name)}
              listId={l.member.id}
              numberOfSavedObjects={l.listings.length}
              firstObjectImage={l.listings[0]?.ld_json.image}
            />
          ))}
      </View>
    </View>
  );
}
