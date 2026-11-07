// Insert the 50 listings. Returns idOf, which turns a listing number (1-50) into its database id.
import { supabaseAdmin } from "../../lib/supabaseAdmin.ts";
import { AGENCY, check, fail, type IdOf } from "../setup/helpers.ts";
import { buildListingRows, PLACES } from "./listingRows.ts";

export async function createListings(now: number): Promise<IdOf> {
  const municipalityNames = PLACES.map((p) => p.municipality);
  const foundMunicipalities = check(
    await supabaseAdmin
      .from("municipalities")
      .select("name")
      .in("name", municipalityNames),
    "read municipalities",
  );
  if (foundMunicipalities.length !== municipalityNames.length) {
    fail(
      "Municipalities are missing. Run node scripts/places/seedPlaces.ts first.",
    );
  }

  const listings = check(
    await supabaseAdmin
      .from("listings")
      .insert(buildListingRows(now))
      .select("id, external_id"),
    "insert listings",
  );
  const listingId = new Map<number, number>(
    listings.map((l) => [l.external_id, l.id]),
  );

  console.log(`Created ${listings.length} listings (agency '${AGENCY}')`);

  return (n: number) => listingId.get(n)!;
}
