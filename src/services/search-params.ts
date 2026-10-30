import { supabase } from "@/lib/supabase";
import { ClientFilter, ScraperFilter } from "@/stores/onboarding";

// Save search, creates row or updates if it already exist
export function saveSearchParams(
  userId: string,
  scraperFilter: ScraperFilter,
  clientFilter: ClientFilter,
) {
  return supabase.from("search_params").upsert(
    {
      user_id: userId,
      property_types: scraperFilter.propertyTypes,
      municipalities: [scraperFilter.municipality],
      areas: clientFilter.area,
      min_rooms: clientFilter.minRooms,
      max_monthly_fee: clientFilter.maxMonthlyFee,
      min_living_area: clientFilter.minLivingArea,
      include_new_construction: clientFilter.showNewProduction,
    },
    { onConflict: "user_id" },
  );
}
