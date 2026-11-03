// A row in search_params, as returned by getSearchParams()
export type SearchParamsRow = {
  property_types: string[];
  municipalities: string[];
  areas: string[];
  min_rooms: number | null;
  max_monthly_fee: number | null;
  min_living_area: number | null;
  // null counts as true, see schema.sql
  include_new_construction: boolean | null;
};
