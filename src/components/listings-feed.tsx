import { ObjectCard } from "@/components/object-card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  ALL_OPTION,
  ALL_VALUE,
  PROPERTY_TYPES_OPTIONS,
  SORT_OPTIONS,
} from "@/constants/filter-options";
import { useListingTags } from "@/hooks/useListingTags";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useSession } from "@/hooks/useSession";
import { useUserTags } from "@/hooks/useUserTags";
import { Listing } from "@/types/listing";
import { SelectOption } from "@/types/select-option";
import { BasePath, goToObject } from "@/utils/go-to-object";
import { isNewConstruction } from "@/utils/is-new-construction";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import FilterSelect from "./filter/filter-select";
import FormError from "./form-error";

type ListingsProps = {
  title: string;
  listings: (Listing & { is_new?: boolean; user_listing_id?: number })[];
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
  const { tags, error: tagsError } = useUserTags(userId);
  const { listingTags } = useListingTags(userId);
  const { scraperFilter } = useSearchParams(userId);

  // Only worth filtering when there is more than one option to choose between
  const showPropertyTypeFilter = (scraperFilter?.propertyTypes.length ?? 0) > 1;
  const showCategoryFilter = tags.length > 1;

  const [sort, setSort] = useState<SelectOption>();
  const [propertyType, setPropertyType] = useState<SelectOption>();
  const [category, setCategory] = useState<SelectOption>();

  const tagOptions: SelectOption[] = tags.map((t) => ({
    value: String(t.id),
    label: t.tag_name,
  }));

  // The listings after the filters and the sorting. Listings arrive newest first
  const visibleListings = useMemo(() => {
    // The user_listing_ids that have the chosen category
    const taggedIds =
      category && category.value !== ALL_VALUE
        ? new Set(
            listingTags
              .filter((lt) => String(lt.user_tag_id) === category.value)
              .map((lt) => lt.user_listing_id),
          )
        : null;

    const filtered = listings.filter((l) => {
      const matchesType =
        !propertyType ||
        propertyType.value === ALL_VALUE ||
        l.property_type === propertyType.value;
      const matchesCategory =
        !taggedIds ||
        (l.user_listing_id !== undefined && taggedIds.has(l.user_listing_id));
      return matchesType && matchesCategory;
    });

    switch (sort?.value) {
      case "oldest":
        return [...filtered].reverse();
      case "price-low":
        // Listings without a price go last
        return [...filtered].sort(
          (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
        );
      case "price-high":
        return [...filtered].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
      default:
        return filtered;
    }
  }, [listings, propertyType, sort, category, listingTags]);

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

      <ScrollView
        horizontal
        className="flex-grow-0 flex-shrink-0 pb-6"
        contentContainerClassName="gap-1"
        showsHorizontalScrollIndicator={false}
      >
        <FilterSelect
          value={sort}
          placeholder="Sortera"
          onValueChange={setSort}
          options={SORT_OPTIONS}
          fieldColor="bg-white"
        />
        {showPropertyTypeFilter && (
          <FilterSelect
            value={propertyType}
            placeholder="Bostadstyp"
            onValueChange={setPropertyType}
            options={[ALL_OPTION, ...PROPERTY_TYPES_OPTIONS]}
            fieldColor="bg-white"
          />
        )}
        {showCategoryFilter && (
          <FilterSelect
            placeholder="Kategorier"
            value={category}
            onValueChange={setCategory}
            options={[ALL_OPTION, ...tagOptions]}
            fieldColor="bg-white"
          />
        )}
      </ScrollView>

      {isLoading && <Text>Laddar...</Text>}
      {error && <FormError>{error}</FormError>}
      {tagsError && <FormError>{tagsError}</FormError>}

      {!isLoading && !error && visibleListings.length === 0 && (
        <Text>Inga objekt hittades.</Text>
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
