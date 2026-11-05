import { ALL_VALUE } from "@/constants/filter-options";
import { useListingTags } from "@/hooks/useListingTags";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useUserTags } from "@/hooks/useUserTags";
import { Listing } from "@/types/listing";
import { SelectOption } from "@/types/select-option";
import { useMemo, useState } from "react";

export type FeedListing = Listing & {
  is_new?: boolean;
  user_listing_id?: number;
};

// Owns the filter state and applies the filters and the sorting to the listings
export function useFilteredListings(
  listings: FeedListing[],
  userId: string | undefined,
) {
  const { tags, error: tagsError } = useUserTags(userId);
  const { listingTags } = useListingTags(userId);
  const { scraperFilter } = useSearchParams(userId);

  const [sort, setSort] = useState<SelectOption>();
  const [propertyType, setPropertyType] = useState<SelectOption>();
  const [category, setCategory] = useState<SelectOption>();

  // Only worth filtering when there is more than one option to choose between
  const showPropertyTypeFilter = (scraperFilter?.propertyTypes.length ?? 0) > 1;
  const showCategoryFilter = tags.length > 1;

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

  return {
    visibleListings,
    tagsError,
    filters: {
      sort,
      setSort,
      propertyType,
      setPropertyType,
      category,
      setCategory,
      tagOptions,
      showPropertyTypeFilter,
      showCategoryFilter,
    },
  };
}

export type ListingFilters = ReturnType<typeof useFilteredListings>["filters"];
