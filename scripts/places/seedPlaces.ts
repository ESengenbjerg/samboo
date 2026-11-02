// This file aims to fill the counties and municipalities tables once, from the list in places/data/swedishPlaces.ts.

// After this the tables are the source of truth for the app. The list is kept as seed data (e.g. for a fork). It is separate from
// lib/swedishPlaces.ts, which belongs to agency1.
// Counties first, because every municipality points to its county. Safe to run again: existing rows are updated, nothing is duplicated.
// Usage: node scripts/places/seedPlaces.ts

process.loadEnvFile(".env");

const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");
const { COUNTIES } = await import("./data/swedishPlaces.ts");

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

const countyId = new Map(counties.map((c) => [c.name as string, c.id as number]));

// 2. Municipalities, each with the id of its county
const municipalityRows = Object.entries(COUNTIES).flatMap(([county, names]) =>
  names.map((name) => ({ name, county_id: countyId.get(county) })),
);

const { error: municipalityError } = await supabaseAdmin
  .from("municipalities")
  .upsert(municipalityRows, { onConflict: "name" });

if (municipalityError) {
  console.error("Could not seed municipalities:", municipalityError);
  process.exit(1);
}

console.log(
  `Upserted ${countyRows.length} counties and ${municipalityRows.length} municipalities`,
);
