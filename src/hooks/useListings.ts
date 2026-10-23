import { getActiveListings } from "@/services/listings";
import { Listing } from "@/types/listing";
import { useEffect, useState } from "react";

export function useListings() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);

  // Get data from database on first run
  useEffect(() => {
    getActiveListings().then(({ data, error }) => {
      if (error) console.error("Failed to load listings: ", error);
      else setListings(data);
      setLoading(false);
    });
  }, []);

  return { listings, loading };
}
