// This file aims to fill the counties, municipalities and areas tables once, from the lists in seed/places/data/swedishPlaces.ts and seed/places/data/areas.ts.

// After this the tables are the source of truth for the app. The list is kept as seed data (e.g. for a fork). It is separate from
// scraper/swedishPlaces.ts, which belongs to agency1.
// Counties first, because every municipality points to its county. Safe to run again: existing rows are updated, nothing is duplicated.
// Usage: node scripts/seed/places/seedPlaces.ts

process.loadEnvFile(".env");

const { supabaseAdmin } = await import("../../lib/supabaseAdmin.ts");
const { COUNTIES } = await import("./data/swedishPlaces.ts");
const { AREAS } = await import("./data/areas.ts");

// 1. Counties
const countyRows = Object.keys(COUNTIES).map((name) => ({ name }));

const { data: counties, error: countyError } = await supabaseAdmin
  .from("counties")
  .upsert(countyRows, { onConflict: "name" })
  .select("id, name");

if (countyError || !counties) {
  console.error("Could not seed counties:", countyError);
  process.exit(1);
}

const countyId = new Map(counties.map((c) => [c.name, c.id]));

// 2. Municipalities, each with the id of its county
const municipalityRows = Object.entries(COUNTIES).flatMap(([county, names]) =>
  names.map((name) => {
    const county_id = countyId.get(county);
    if (county_id === undefined) {
      throw new Error(`County ${county} missing after upsert`);
    }
    return { name, county_id };
  }),
);

const { data: municipalities, error: municipalityError } = await supabaseAdmin
  .from("municipalities")
  .upsert(municipalityRows, { onConflict: "name" })
  .select("id, name");

if (municipalityError || !municipalities) {
  console.error("Could not seed municipalities:", municipalityError);
  process.exit(1);
}

const municipalityId = new Map(municipalities.map((m) => [m.name, m.id]));

// 3. Areas, each with the id of its municipality
const areaRows = Object.entries(AREAS).flatMap(([municipality, areas]) =>
  areas.map((area) => {
    const municipality_id = municipalityId.get(municipality);
    if (municipality_id === undefined) {
      throw new Error(`Municipality ${municipality} missing after upsert`);
    }
    return {
      municipality_id,
      name: area.name,
      display_name: area.display_name ?? null,
    };
  }),
);

// The unique index is on lower(name), which upsert cannot target. So look up what exists and split the rows by hand.
const { data: existingAreas, error: existingAreaError } = await supabaseAdmin
  .from("areas")
  .select("id, municipality_id, name")
  .in("municipality_id", [...new Set(areaRows.map((a) => a.municipality_id))]);

if (existingAreaError || !existingAreas) {
  console.error("Could not read existing areas:", existingAreaError);
  process.exit(1);
}

const areaKey = (area: { municipality_id: number; name: string }) =>
  `${area.municipality_id}:${area.name.toLowerCase()}`;
const existingAreaId = new Map(existingAreas.map((a) => [areaKey(a), a.id]));

const newAreas = areaRows.filter((a) => !existingAreaId.has(areaKey(a)));
const knownAreas = areaRows.flatMap((a) => {
  const id = existingAreaId.get(areaKey(a));
  return id === undefined ? [] : [{ ...a, id }];
});

if (newAreas.length > 0) {
  const { error } = await supabaseAdmin.from("areas").insert(newAreas);
  if (error) {
    console.error("Could not add areas:", error);
    process.exit(1);
  }
}

// Has the id, so this matches on the primary key and updates display_name
if (knownAreas.length > 0) {
  const { error } = await supabaseAdmin.from("areas").upsert(knownAreas);
  if (error) {
    console.error("Could not update areas:", error);
    process.exit(1);
  }
}

console.log(
  `Upserted ${countyRows.length} counties and ${municipalityRows.length} municipalities. ` +
    `Areas: ${newAreas.length} added, ${knownAreas.length} updated`,
);
