import { supabase } from "@/lib/supabase";
import { getActiveListings } from "@/services/listings";
import { Listing } from "@/types/listing";
import { useEffect, useState } from "react";

export function useListings() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);

  // Get data from Supabase on first run
  useEffect(() => {
    async function load() {
      // Get user from Supabase
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setLoading(false);
        return;
      }

      // Get correct listings feed based on userId
      const { data, error } = await getActiveListings(auth.user.id);
      if (error) console.error("Failed to load listings: ", error);
      else setListings(data.map((row) => row.listings));
      setLoading(false);
    }
    load();
  }, []);

  return { listings, loading };
}
