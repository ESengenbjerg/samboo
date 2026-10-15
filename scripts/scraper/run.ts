// This file is the main file for scraping.
// It aims to read all users search_params, Build a scope from them.
// Then scrape by scope on each agency & save result into listings
// Then finally match the result to users in user_listings table

// -------------------------------------------------
// THIS FILE DOES NOT HANDLE REMOVED OBJECTS YET!
// -------------------------------------------------

import { chromium } from "playwright";
import * as mockdata from "./agencies/mockdata.ts";
import type { Agency, SearchParamsRow } from "../lib/types.ts";
import { buildScope } from "./scope.ts";

process.loadEnvFile(".env");

// THIS REQUIRES NODE v.25
const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

// Agencies are scraped one after another. ADD NEW AGENCIES HERE!!!
const agencies: Agency[] = [mockdata];

// // node scripts/scraper/run.ts --dry-run  -> print scope and URLs, scrape nothing
// const dryRun = process.argv.includes("--dry-run"); // For test

// ---------------------- READ SEARCH PARAMS --------------------------
const { data: searchParams, error: searchError } = await supabaseAdmin
  .from("search_params")
  .select("user_id, property_types, municipalities, areas")
  .overrideTypes<SearchParamsRow[]>();

if (searchError) {
  console.error("Failed to read search_params:", searchError);
  process.exit(1);
}

// ---------------------- BUILD SCOPE --------------------------
const { items: scope, skipped } = buildScope(searchParams ?? []);

for (const userId of skipped) {
  console.warn(`Skipping search without a place (user ${userId})`);
}

if (scope.length === 0) {
  console.log("Nothing to scrape");
  process.exit(0);
}

console.log(`Scope: ${scope.length} distinct searches`);
console.log(JSON.stringify(scope, null, 2));

// if (dryRun) {
//   for (const agency of agencies) {
//     console.log(`\n${agency.AGENCY}:`);
//     for (const url of agency.buildUrls(scope)) console.log(`  ${url}`);
//   }
//   process.exit(0);
// }

// ---------------------- SCRAPE + SAVE --------------------------
let failedAgencies = 0;
const browser = await chromium.launch({ headless: true });

try {
  for (const agency of agencies) {
    try {
      const { rows, failedUrls } = await agency.scrape(scope, browser);

      if (rows.length > 0) {
        const { error } = await supabaseAdmin
          .from("listings")
          .upsert(rows, { onConflict: "agency,external_id" });
        if (error) throw error;
      }

      console.log(
        `${agency.AGENCY}: saved ${rows.length} listings, ${failedUrls.length} pages failed`,
      );
    } catch (error) {
      // One agency failing does not stop the others
      failedAgencies++;
      console.error(`Agency ${agency.AGENCY} failed:`, error);
    }
  }
} finally {
  await browser.close();
}

// ---------------------- MATCH --------------------------
// New listings may match existing users' search params
const { data: newMatches, error: matchError } = await supabaseAdmin.rpc(
  "match_user_listings",
);

if (matchError) {
  console.error("Failed to match listings:", matchError);
  failedAgencies++;
} else {
  console.log(`${newMatches} new user matches`);
}

// A non-zero exit code makes a scheduled run show up as failed
if (failedAgencies > 0) process.exitCode = 1;
