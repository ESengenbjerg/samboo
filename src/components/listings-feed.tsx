import { ObjectCard } from "@/components/object-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { FeedListing, useFilteredListings } from "@/hooks/useFilteredListings";
import { useSession } from "@/hooks/useSession";
import { BasePath, goToObject } from "@/utils/go-to-object";
import { isNewConstruction } from "@/utils/is-new-construction";
import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import ListingsFilterBar from "./filter/listings-filter-bar";
import FormError from "./form-error";

type ListingsProps = {
  title: string;
  listings: FeedListing[];
  path: BasePath;
  isLoading: boolean;
  error: string | null;
  showUpdateFilter?: boolean;
};

export default function ListingsFeed({
  title,
  listings,
  path,
  isLoading,
  error,
  showUpdateFilter = false,
}: ListingsProps) {
  const { session } = useSession();
  const userId = session?.user.id;

  const [view, setView] = useState<"column" | "grid">("column");
  const {
    visibleListings,
    error: filterError,
    filters,
  } = useFilteredListings(listings, userId);

  return (
    <View className="flex-1 px-6 bg-background gap-2">
      <View className="flex-row justify-between">
        <View className="self-start">
          <Text variant="h1">{title}</Text>

          {showUpdateFilter && (
            <Button variant="link" className="px-0 pt-0 self-start">
              <Link href="/(tabs)/update-filter">
                <Text>Uppdatera bevakning</Text>
              </Link>
            </Button>
          )}
        </View>

        {/* TODO: Replace with correct component */}
        <Button
          onPress={() =>
            view === "column" ? setView("grid") : setView("column")
          }
          className="h-11"
        >
          <Text>Toggle</Text>
        </Button>
      </View>

      <ListingsFilterBar filters={filters} />

      {isLoading && <Spinner size="large" />}
      {error && <FormError>{error}</FormError>}
      {filterError && <FormError>{filterError}</FormError>}

      {!isLoading && !error && visibleListings.length === 0 && (
        <Text>
          {listings.length > 0
            ? "Inga bostäder inom valda filter"
            : "Inga objekt hittades."}
        </Text>
      )}

      {/* Present properties based in column or grid based on user choice */}
      <ScrollView
        className="bg-background"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View
          className={`${view === "grid" ? "flex-row gap-2 mb-4 flex-wrap" : "gap-4 mb-4"}`}
        >
          {/* Map through properties */}
          {visibleListings.map((listing) => (
            <ObjectCard
              key={listing.id}
              address={listing.address ?? ""}
              area={listing.area ?? ""}
              municipality={listing.municipality ?? ""}
              price={listing.price ?? 0}
              livingArea={listing.living_area ?? 0}
              rooms={listing.rooms ?? 0}
              imageUrl={listing.image_url ?? ""}
              onPress={() => goToObject(listing.id, path)}
              listingId={listing.id}
              isNew={listing.is_new}
              isNewConstruction={isNewConstruction(listing)}
              size={view === "grid" ? "small" : "default"}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
