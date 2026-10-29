import ListButton from "@/components/saved/list-button";
import ScheduledShowing from "@/components/saved/scheduled-showing";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { MY_LIST_ID, SHARED_LIST_ID } from "@/constants/saved-lists";
import { useGroupLikedListings } from "@/hooks/useGroupLikedListings";
import { useLikedListings } from "@/hooks/useLikedListings";
import { useSession } from "@/hooks/useSession";
import { useSharedLikedListings } from "@/hooks/useSharedLikedListings";
import { useShowings } from "@/hooks/useShowings";
import { nameEndsWithS } from "@/utils/name-ends-with-s";
import { ScrollView, View } from "react-native";

export default function SavedScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
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
  const {
    showings,
    isLoading: showingsLoading,
    error: showingError,
  } = useShowings(userId, "upcoming");
  const pastShowings = useShowings(userId, "past");

  if (!userId) return null;

  return (
    <ScrollView className="bg-background">
      <View className="flex-1 px-6 bg-background gap-8">
        <Text variant="h1">Mina listor</Text>
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

        <View className="flex-row items-end justify-between">
          <Text variant="h2" className="mt-4">
            Bokade visningar
          </Text>
          <Button variant="link">
            <Text>Tidigare visningar</Text>
          </Button>
        </View>
        {/* TODO: Replace hardcoded values with correct data */}
        <View>
          {showings.length !== 0 &&
            showings.map((s) => (
              <ScheduledShowing
                key={s.id}
                id={s.id}
                address={s.address}
                municipality={s.municipality}
                area={s.area}
                startsAt={new Date(s.startsAt)}
              />
            ))}
        </View>
      </View>
    </ScrollView>
  );
}
