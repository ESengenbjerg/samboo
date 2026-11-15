import { supabase } from "@/lib/supabase";
import type { Tables } from "@shared/database.types";

export type Municipality = Pick<Tables<"municipalities">, "id" | "name">;

// display_name: label to show instead of name. name is what is saved in search_params
export type Area = Pick<
  Tables<"areas">,
  "id" | "municipality_id" | "name" | "display_name"
>;

// All 290 municipalities. Few enough to search through in the app
export function getMunicipalities() {
  return supabase
    .from("municipalities")
    .select("id, name")
    .order("name");
}

// All areas. Entered by hand, so the table is small
export function getAreas() {
  return supabase
    .from("areas")
    .select("id, municipality_id, name, display_name")
    .order("name");
}
