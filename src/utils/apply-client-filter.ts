import { ClientFilter } from "@/stores/onboarding";
import { Listing } from "@/types/listing";

// TODO: Test with listings feed (/search) once onboarding is complete.

export function applyClientFilter(
  listings: Listing[],
  filter: ClientFilter,
): Listing[] {
  return listings.filter((listing) => {
    if (
      filter.minRooms !== undefined &&
      listing.rooms !== null &&
      listing.rooms < filter.minRooms
    )
      return false;

    if (
      filter.maxMonthlyFee !== undefined &&
      listing.monthly_fee != null &&
      listing.monthly_fee > filter.maxMonthlyFee
    )
      return false;

    if (
      filter.minLivingArea !== undefined &&
      listing.living_area &&
      listing.living_area < filter.minLivingArea
    )
      return false;

    if (!filter.showNewProduction && listing.ld_json.newProduction)
      return false;

    return true;
  });
}
