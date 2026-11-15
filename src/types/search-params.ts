import type { Tables } from "@shared/database.types";

// A row in search_params, as returned by getSearchParams().
// include_new_construction: null counts as true, see schema.sql
export type SearchParamsRow = Pick<
  Tables<"search_params">,
  | "property_types"
  | "municipalities"
  | "areas"
  | "min_rooms"
  | "max_monthly_fee"
  | "min_living_area"
  | "include_new_construction"
>;
