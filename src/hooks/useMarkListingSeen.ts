import { markListingSeen } from "@/services/listings";
import { useEffect } from "react";

// Marks a listing as seen every time the listing page opens. listingId is listings.id,
// undefined while the listing is loading.
// Always sent, not only when my is_new is true: a group member's listing outside my search
// has no is_new for me, but must still be remembered as seen (see my_new_listing_ids())
export function useMarkListingSeen(listingId: number | undefined) {
  useEffect(() => {
    if (listingId === undefined) return;

    // Fire and forget: the page does not wait for it, and a failure only means the
    // "Ny" tag stays until the next visit
    markListingSeen(listingId).then(({ error }) => {
      if (error) console.error("Failed to mark listing as seen: ", error);
    });
  }, [listingId]);
}
