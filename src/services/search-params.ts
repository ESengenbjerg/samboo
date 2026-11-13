import { supabase } from "@/lib/supabase";
import { ClientFilter, ScraperFilter } from "@/stores/onboarding";
import { commonErrorMessage } from "@/utils/error-message/common-messages";

// My saved search. data is null if I have not made one
export function getSearchParams(userId: string) {
  return supabase
    .from("search_params")
    .select(
      "property_types, municipalities, areas, min_rooms, max_monthly_fee, min_living_area, include_new_construction",
    )
    .eq("user_id", userId)
    .maybeSingle();
}

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
      municipalities: scraperFilter.municipalities,
      areas: clientFilter.area,
      // ?? null: undefined is left out of the request, so an upsert would keep
      // the old value when the user clears a filter
      min_rooms: clientFilter.minRooms ?? null,
      max_monthly_fee: clientFilter.maxMonthlyFee ?? null,
      min_living_area: clientFilter.minLivingArea ?? null,
      include_new_construction: clientFilter.showNewConstruction,
    },
    { onConflict: "user_id" },
  );
}

// Swedish message for errors from saving the search
export function searchParamsErrorMessage(error: { message?: string } | null) {
  // Thrown by limit_search_params_changes(): max 5 changes per 24 hours
  if (error?.message?.includes("för många gånger")) {
    return "Du har ändrat din bevakning för många gånger. Försök igen senare.";
  }
  return commonErrorMessage(
    error,
    "Kunde inte spara bevakningen. Försök igen.",
  );
}
