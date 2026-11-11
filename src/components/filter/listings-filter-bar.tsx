import { ALL_OPTION, SORT_OPTIONS } from "@/constants/filter-options";
import { ListingFilters } from "@/hooks/useFilteredListings";
import { ScrollView } from "react-native";
import FilterSelect from "./filter-select";

export default function ListingsFilterBar({
  filters,
}: {
  filters: ListingFilters;
}) {
  const {
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
  } = filters;

  return (
    <ScrollView
      horizontal
      className="flex-grow-0 flex-shrink-0 pb-2"
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
          options={[ALL_OPTION, ...propertyTypeOptions]}
          fieldColor="bg-white"
        />
      )}
      {showCategoryFilter && (
        <FilterSelect
          placeholder="Taggar"
          label="Dina taggar"
          value={category}
          onValueChange={setCategory}
          options={[ALL_OPTION, ...tagOptions]}
          fieldColor="bg-white"
        />
      )}
    </ScrollView>
  );
}
