import { Listing } from "@/types/listing";
import { supabase } from "@/utils/supabase";

export async function getListings() {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .is("removed_at", null)
    .order("last_seen_at", { ascending: false })
    .overrideTypes<Listing[]>();
  if (error) throw error;
  return data;
}
