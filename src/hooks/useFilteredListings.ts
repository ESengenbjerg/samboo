import { ALL_VALUE, PROPERTY_TYPES_OPTIONS } from "@/constants/filter-options";
import { useListingTags } from "@/hooks/useListingTags";
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
  const { tags } = useUserTags(userId);
  const { listingTags, error: listingTagsError } = useListingTags(userId);

  const [sort, setSort] = useState<SelectOption>();
  const [selectedType, setPropertyType] = useState<SelectOption>();
  const [selectedCategory, setCategory] = useState<SelectOption>();

  // Only worth filtering when there is more than one option to choose between
  const showCategoryFilter = tags.length > 1;

  // Only the property types that exist among the listings
  const listingTypes = new Set(listings.map((l) => l.property_type));
  const propertyTypeOptions = PROPERTY_TYPES_OPTIONS.filter((o) =>
    listingTypes.has(o.value),
  );
  const showPropertyTypeFilter = propertyTypeOptions.length > 1;

  const tagOptions: SelectOption[] = tags.map((t) => ({
    value: String(t.id),
    label: t.tag_name,
  }));

  // A choice only counts while its filter is visible and still offers that option.
  // Otherwise it would filter invisibly, with no way for the user to reset it
  const activeOption = (
    selected: SelectOption | undefined,
    visible: boolean,
    options: SelectOption[],
  ) =>
    visible &&
    (selected?.value === ALL_VALUE ||
      options.some((o) => o.value === selected?.value))
      ? selected
      : undefined;
  const propertyType = activeOption(
    selectedType,
    showPropertyTypeFilter,
    propertyTypeOptions,
  );
  const category = activeOption(
    selectedCategory,
    showCategoryFilter,
    tagOptions,
  );

  // The listings after the filters and the sorting. Listings arrive newest first
  const visibleListings = useMemo(() => {
    // The listing ids (listings.id) that have the chosen category. Matching on listings.id
    // instead of user_listing_id makes it work in every list: in a group member's list the
    // rows are theirs, and in the shared list there is no user_listing_id at all
    const taggedIds =
      category && category.value !== ALL_VALUE
        ? new Set(
            listingTags
              .filter((lt) => String(lt.user_tag_id) === category.value)
              .map((lt) => lt.user_listings?.listing_id),
          )
        : null;

    const filtered = listings.filter((l) => {
      const matchesType =
        !propertyType ||
        propertyType.value === ALL_VALUE ||
        l.property_type === propertyType.value;
      const matchesCategory = !taggedIds || taggedIds.has(l.id);
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
    // Only relevant when the category filter is shown. If useUserTags fails, tags is
    // empty and the filter is hidden, so only the listing_tags error can show here
    error: showCategoryFilter ? listingTagsError : null,
    filters: {
      sort,
      setSort,
      propertyType,
      setPropertyType,
      category,
      setCategory,
      propertyTypeOptions,
      tagOptions,
      showPropertyTypeFilter,
      showCategoryFilter,
    },
  };
}

export type ListingFilters = ReturnType<typeof useFilteredListings>["filters"];
