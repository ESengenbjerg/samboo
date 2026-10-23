import { supabase } from "@/utils/supabase";

type SearchParamsInput = {
  propertyTypes: string[];
  area: string;
};

// Creates the user's search, or updates it if it already exists
export async function saveSearchParams(filter: SearchParamsInput) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");

  const { error } = await supabase.from("search_params").upsert(
    {
      user_id: session.user.id,
      property_types: filter.propertyTypes,
      areas: [filter.area],
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
