import {
  ALL_OPTION,
  NEW_CONSTRUCTION_OPTIONS,
  SORT_OPTIONS,
} from "@/constants/filter-options";
import { ListingFilters } from "@/hooks/listings/useFilteredListings";
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
    tag,
    setTag,
    area,
    setArea,
    areaOptions,
    showAreaFilter,
    newConstruction,
    setNewConstruction,
    propertyTypeOptions,
    tagOptions,
    showPropertyTypeFilter,
    showTagFilter,
    showNewConstructionFilter,
  } = filters;

  return (
    <ScrollView
      horizontal
      className="flex-grow-0 flex-shrink-0 py-6"
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
      {showAreaFilter && (
        <FilterSelect
          value={area}
          placeholder="Område"
          onValueChange={setArea}
          options={[ALL_OPTION, ...areaOptions]}
          fieldColor="bg-white"
        />
      )}
      {showTagFilter && (
        <FilterSelect
          placeholder="Taggar"
          dropdownLabel="Dina taggar"
          value={tag}
          onValueChange={setTag}
          options={[ALL_OPTION, ...tagOptions]}
          fieldColor="bg-white"
        />
      )}
      {showNewConstructionFilter && (
        <FilterSelect
          placeholder="Nyproduktion"
          value={newConstruction}
          onValueChange={setNewConstruction}
          options={[ALL_OPTION, ...NEW_CONSTRUCTION_OPTIONS]}
          fieldColor="bg-white"
        />
      )}
    </ScrollView>
  );
}
