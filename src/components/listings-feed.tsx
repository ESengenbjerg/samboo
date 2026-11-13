import { ObjectCard } from "@/components/object-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useSession } from "@/hooks/auth/useSession";
import { useBackToTop } from "@/hooks/useBackToTop";
import { useTabBarInset } from "@/hooks/useTabBarInset";
import { FeedListing, useFilteredListings } from "@/hooks/useFilteredListings";
import { useSeenListingsStore } from "@/stores/seen-listings";
import { BasePath, goToObject } from "@/utils/go-to-object";
import { isListingRemoved } from "@/utils/is-listing-removed";
import { isNewConstruction } from "@/utils/is-new-construction";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import BackToTopButton from "./back-to-top-button";
import ListingsFilterBar from "./filter/listings-filter-bar";
import FormError from "./form-error";
import { ViewColumnIcon, ViewGridIcon } from "./view-icons";

type ListingsProps = {
  title: string;
  listings: FeedListing[];
  path: BasePath;
  isLoading: boolean;
  error: string | null;
  showUpdateFilter?: boolean;
  emptyMessage?: string;
};

export default function ListingsFeed({
  title,
  listings,
  path,
  isLoading,
  error,
  showUpdateFilter = false,
  emptyMessage = "Inga objekt hittades.",
}: ListingsProps) {
  const { session } = useSession();
  const userId = session?.user.id;

  const [view, setView] = useState<"column" | "grid">("column");

  // Listings I opened this session: their "Ny" tag goes away before the refetch
  const seenIds = useSeenListingsStore((s) => s.seenIds);

  const {
    visibleListings,
    error: filterError,
    filters,
  } = useFilteredListings(listings, userId);

  const { scrollRef, showBackToTop, handleScroll, scrollToTop } =
    useBackToTop();
  const tabBarInset = useTabBarInset();

  return (
    <>
      <View className="flex-1 px-6 bg-background">
        <ScrollView
          ref={scrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          className="bg-background"
          contentContainerStyle={{ paddingBottom: tabBarInset + 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View className="flex-row items-center justify-between">
              <Text variant="h1">{title}</Text>

              {/* Feed view toggle */}
              <View className="flex-row gap-1.5">
                <Pressable
                  onPress={() => setView("column")}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Kolumnvy"
                  accessibilityState={{ selected: view === "column" }}
                >
                  <ViewColumnIcon filled={view === "column"} />
                </Pressable>
                <Pressable
                  onPress={() => setView("grid")}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Rutnätsvy"
                  accessibilityState={{ selected: view === "grid" }}
                >
                  <ViewGridIcon filled={view === "grid"} />
                </Pressable>
              </View>
            </View>

            {showUpdateFilter && (
              <Button variant="link" className="px-0 pt-0 self-start">
                <Link href="/(tabs)/update-filter">
                  <Text>Uppdatera bevakning</Text>
                </Link>
              </Button>
            )}
          </View>

          <ListingsFilterBar filters={filters} />

          {isLoading && <Spinner size="large" />}
          {error && <FormError>{error}</FormError>}
          {filterError && <FormError>{filterError}</FormError>}

          {!isLoading && !error && visibleListings.length === 0 && (
            <Text>
              {listings.length > 0
                ? "Inga bostäder inom valda filter"
                : emptyMessage}
            </Text>
          )}

          {/* Present properties based in column or grid based on user choice */}
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
                isRemoved={isListingRemoved(listing)}
                isNew={listing.is_new && !seenIds.has(listing.id)}
                isNewConstruction={isNewConstruction(listing)}
                size={view === "grid" ? "small" : "default"}
              />
            ))}
          </View>
        </ScrollView>
        {showBackToTop && <BackToTopButton onPress={scrollToTop} />}
      </View>
    </>
  );
}
