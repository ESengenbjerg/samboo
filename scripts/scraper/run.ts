// This file is the main file for scraping.
// It aims to read all users search_params, Build a scope from them.
// Then scrape by scope on each agency & save result into listings
// Then finally match the result to users in user_listings table

// ADDED: removed listings are handled now (see removal.ts and issues.ts):
// - A listing the scraper no longer finds gets removed_at, but only after a healthy run
// - A failed run (F1-F4) never touches removed_at, it is logged in scrape_issues
// - A suspicious run (many listings vanish at once) saves/updates what was found, removes nothing,
//   and is logged in scrape_issues
// - Listings removed for more than 14 days are purged at the end of the run

import { chromium } from "playwright";
import { ScrapeLayoutError } from "../lib/errors.ts";
import type {
  Agency,
  IssueKind,
  IssueReason,
  SearchParamsRow,
} from "../lib/types.ts";
import * as mockdata from "./agencies/mockdata.ts";
import {
  notifyAdmin,
  recordIssue,
  resolveIssues,
  shouldNotify,
} from "./issues.ts";
import {
  fetchActiveInScope,
  findMissing,
  isSuspiciousRemoval,
  markRemoved,
  purgeRemoved,
  tooManyPagesFailed,
} from "./removal.ts";
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
// Unexpected errors (a broken db call, a bug). Agency problems go to scrape_issues instead
let failedAgencies = 0;
// Issues the admin must hear about now. Makes the run exit non-zero, so GitHub notifies
let needsAttention = 0;
const browser = await chromium.launch({ headless: true });

// Writes a failed/suspicious run to the backlog and notifies the admin when the rules say so
async function flag(
  agencyName: string,
  kind: IssueKind,
  reason: IssueReason,
  message: string,
  details: Record<string, unknown>,
) {
  console.error(`${agencyName}: ${kind} (${reason}) - ${message}`);
  const issue = await recordIssue(supabaseAdmin, agencyName, kind, reason, {
    message,
    ...details,
  });
  if (shouldNotify(issue)) {
    await notifyAdmin(supabaseAdmin, issue, `${agencyName}: ${message}`);
    needsAttention++;
  }
}

try {
  for (const agency of agencies) {
    try {
      // No search URL for this agency (e.g. none of the chosen types exist there) means nothing was scraped, so nothing can be judged as removed
      if (agency.buildUrls(scope).length === 0) {
        console.log(`${agency.AGENCY}: nothing to scrape in this scope`);
        continue;
      }

      // Fetch active listings in scope BEFORE the upsert, so new listings do not inflate the count
      const activeBefore = await fetchActiveInScope(
        supabaseAdmin,
        agency.AGENCY,
        scope,
      );

      // Failure F1/F2. A throwing scrape() means the result is incomplete, so removed_at is not touched
      let result: Awaited<ReturnType<Agency["scrape"]>>;
      try {
        result = await agency.scrape(scope, browser);
      } catch (error) {
        const reason = error instanceof ScrapeLayoutError ? "F2" : "F1";
        await flag(agency.AGENCY, "failed", reason, String(error), {});
        continue;
      }
      const { rows, failedUrls } = result;

      if (rows.length > 0) {
        const { error } = await supabaseAdmin
          .from("listings")
          .upsert(rows, { onConflict: "agency,external_id" });
        // Failure F4: was thrown to the catch below, now it is a failed run in the backlog
        if (error) {
          await flag(agency.AGENCY, "failed", "F4", error.message, {});
          continue;
        }
      }

      console.log(
        `${agency.AGENCY}: saved ${rows.length} listings, ${failedUrls.length} pages failed`,
      );

      // Failure F3: Too many listing pages failed, the scraper is probably broken
      if (tooManyPagesFailed(rows.length, failedUrls.length)) {
        await flag(
          agency.AGENCY,
          "failed",
          "F3",
          `${failedUrls.length} of ${rows.length + failedUrls.length} listing pages failed`,
          { failedUrls: failedUrls.slice(0, 20) },
        );
        continue;
      }

      // The run is healthy. Which active listings did the scraper not find?
      const seen = new Set(rows.map((row) => row.external_id));
      const missing = findMissing(activeBefore, seen, failedUrls);

      // Suspicious. Keep everything as it is (what was found is already saved above)
      if (isSuspiciousRemoval(activeBefore.length, missing.length)) {
        await resolveIssues(supabaseAdmin, agency.AGENCY, ["failed"]);
        await flag(
          agency.AGENCY,
          "suspicious",
          "mass_removal",
          `${missing.length} of ${activeBefore.length} active listings not found, nothing removed`,
          {
            active: activeBefore.length,
            missing: missing.length,
            missingUrls: missing.slice(0, 20).map((l) => l.url),
          },
        );
        continue;
      }

      // Clean run. Not found = removed, and the open issues for this agency are closed
      await markRemoved(supabaseAdmin, missing, new Date().toISOString());
      await resolveIssues(supabaseAdmin, agency.AGENCY, [
        "failed",
        "suspicious",
      ]);
      console.log(
        `${agency.AGENCY}: marked ${missing.length} listings as removed`,
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

// ---------------------- PURGE --------------------------
// Listings removed for more than 14 days are deleted permanently, so dead data does not accumulate
try {
  const purged = await purgeRemoved(supabaseAdmin);
  console.log(`${purged} old removed listings purged`);
} catch (error) {
  console.error("Failed to purge removed listings:", error);
  failedAgencies++;
}

// A non-zero exit code makes a scheduled run show up as failed.
// When an issue needs the admin's attention (needsAttention), but a single failed agency run does not, so one bad day does not send a notification
if (failedAgencies > 0 || needsAttention > 0) process.exitCode = 1;
