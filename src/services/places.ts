import { supabase } from "@/lib/supabase";

export type Municipality = {
  id: number;
  name: string;
};

export type Area = {
  id: number;
  municipality_id: number;
  name: string;
  // Label to show instead of name. name is what is saved in search_params
  display_name: string | null;
};

// All 290 municipalities. Few enough to search through in the app
export function getMunicipalities() {
  return supabase
    .from("municipalities")
    .select("id, name")
    .order("name")
    .overrideTypes<Municipality[]>();
}

// All areas. Entered by hand, so the table is small
export function getAreas() {
  return supabase
    .from("areas")
    .select("id, municipality_id, name, display_name")
    .order("name")
    .overrideTypes<Area[]>();
}
