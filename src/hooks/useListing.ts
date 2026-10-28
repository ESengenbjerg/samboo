
import { supabase } from "@/lib/supabase";
import { getListing } from "@/services/listings";
import { UserListing } from "@/types/listing";
import { useEffect, useState } from "react";

type ListingResult = {
  listingId: string;
  userListing: UserListing | null;
};

// A single listing (joined with the user's user_listing row) by listings.id
export function useListing(listingId: string | undefined) {
  const [result, setResult] = useState<ListingResult | null>(null);

  useEffect(() => {
    if (!listingId) return;

    // Ignore the response if the id changed or the component unmounted
    let cancelled = false;

    async function load(id: string) {
      // Get user from Supabase
      const { data: auth } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!auth.user) {
        setResult({ listingId: id, userListing: null });
        return;
      }

      // Get user_listing joined with its listing (listing_id -> listings.id)
      const { data, error } = await getListing(auth.user.id, id);
      if (cancelled) return;
      if (error) console.error("Failed to load listing: ", error);
      setResult({ listingId: id, userListing: data ?? null });
    }

    load(listingId);
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  // Never expose a result that belongs to a previous id
  const current = listingId && result?.listingId === listingId ? result : null;

  return {
    userListing: current?.userListing ?? null,
    // Loading until we have a result for the current id
    isLoading: !!listingId && !current,
  };
}
