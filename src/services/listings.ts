import { supabase } from "@/lib/supabase";
import { Listing } from "@/types/listing";

// TODO: Remove policy from listings table to give anon permission to read
export function getActiveListings() {
  return supabase
    .from("listings")
    .select("*")
    .is("removed_at", null)
    .order("last_seen_at", { ascending: false })
    .overrideTypes<Listing[]>();
}
