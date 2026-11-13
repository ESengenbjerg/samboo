import ListButton from "@/components/saved/list-button";
import { Text } from "@/components/ui/text";
import { MY_LIST_ID, SHARED_LIST_ID } from "@/constants/saved-lists";
import { useGroupLikedListings } from "@/hooks/useGroupLikedListings";
import { useLikedListings } from "@/hooks/useLikedListings";
import { useNewListingIds } from "@/hooks/useNewListingIds";
import { useSeenListingsStore } from "@/stores/seen-listings";
import { useSharedLikedListings } from "@/hooks/useSharedLikedListings";
import { Listing } from "@/types/listing";
import { nameEndsWithS } from "@/utils/name-ends-with-s";
import { View } from "react-native";
import { Spinner } from "../ui/spinner";

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

  // The listings I have not opened yet, matched on listings.id in every list
  const { newListingIds } = useNewListingIds(userId);
  const seenIds = useSeenListingsStore((s) => s.seenIds);

  // How many listings in a list are new to me
  function countNew(list: Listing[]) {
    return list.filter((l) => newListingIds.has(l.id) && !seenIds.has(l.id))
      .length;
  }

  return (
    <View>
      <Text variant="h1" className="mb-8">
        Mina listor
      </Text>
      {/* List container */}
      <View className="gap-4">
        {isLoadingShared && <Spinner size="large" />}
        {sharedError && <Text>{sharedError}</Text>}

        {/*  Shared list -- only visible if session user is in a group */}
        {memberLists.length > 0 && (
          <ListButton
            title={"Gemensam"}
            listId={SHARED_LIST_ID}
            numberOfSavedObjects={sharedListings.length}
            firstObjectImage={sharedListings[0]?.image_url ?? undefined}
            newObjects={countNew(sharedListings)}
          />
        )}

        {isLoadingGroup && <Spinner size="large" />}
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
              firstObjectImage={l.listings[0]?.image_url ?? undefined}
              newObjects={countNew(l.listings)}
            />
          ))}

        {isLoading && <Spinner size="large" />}
        {error && <Text>{error}</Text>}

        {/* My list */}
        {!isLoading && !error && (
          <ListButton
            title={"Min"}
            listId={MY_LIST_ID}
            numberOfSavedObjects={listings.length}
            firstObjectImage={listings[0]?.image_url ?? undefined}
          />
        )}
      </View>
    </View>
  );
}
