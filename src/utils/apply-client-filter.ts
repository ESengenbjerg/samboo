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
      listing.ld_json.monthlyFee !== undefined &&
      listing.ld_json.monthlyFee > filter.maxMonthlyFee
    )
      return false;

    if (
      filter.minLivingArea !== undefined &&
      listing.ld_json.livingArea &&
      listing.ld_json.livingArea < filter.minLivingArea
    )
      return false;

    if (!filter.showNewProduction && listing.ld_json.newProduction)
      return false;

    return true;
  });
}
