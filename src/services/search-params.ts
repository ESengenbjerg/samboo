import { supabase } from "@/lib/supabase";
import { ScraperFilter } from "@/stores/onboarding";

// Save search, creates row or updates if it already exist
export function saveSearchParams(userId: string, filter: ScraperFilter) {
  return supabase.from("search_params").upsert(
    {
      user_id: userId,
      property_types: filter.propertyTypes,
      areas: [filter.area],
    },
    { onConflict: "user_id" },
  );
}
