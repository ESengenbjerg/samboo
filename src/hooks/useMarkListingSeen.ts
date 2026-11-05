import { markListingSeen } from "@/services/listings";
import { useEffect } from "react";

// Marks a listing as seen when the listing page opens.
// listingId is listings.id. isNew is user_listings.is_new, undefined while it is loading
// or if I have no row for the listing. Nothing is sent unless the listing is new
export function useMarkListingSeen(
  listingId: number | undefined,
  isNew: boolean | undefined,
) {
  useEffect(() => {
    if (listingId === undefined || !isNew) return;

    // Fire and forget: the page does not wait for it, and a failure only means the
    // "Ny" tag stays until the next visit
    markListingSeen(listingId).then(({ error }) => {
      if (error) console.error("Failed to mark listing as seen: ", error);
    });
  }, [listingId, isNew]);
}
