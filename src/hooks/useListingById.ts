import { getListingById } from "@/services/listings";
import { Listing } from "@/types/listing";
import { useEffect, useState } from "react";

type ListingByIdResult = {
  listingId: string;
  listing: Listing | null;
};

// A single listing by listings.id. Works for my own listings and for
// listings that only a group member has been matched with
export function useListingById(listingId: string | undefined) {
  const [result, setResult] = useState<ListingByIdResult | null>(null);

  useEffect(() => {
    if (!listingId) return;

    // Ignore the response if the id changed or the component unmounted
    let cancelled = false;

    getListingById(listingId).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error("Failed to load listing: ", error);
      setResult({ listingId, listing: data ?? null });
    });

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  // Never expose a result that belongs to a previous id
  const current = listingId && result?.listingId === listingId ? result : null;

  return {
    listing: current?.listing ?? null,
    // Loading until we have a result for the current id
    isLoading: !!listingId && !current,
  };
}
