// Main file for scraper: reads every search param, scrapes each agency, saves the listings and matches them to users.
// How removed, failed and suspicious runs are handled: docs/removed_listings.md

import { chromium } from "playwright";
import type { Json } from "../../shared/database.types.ts";
import { ScrapeLayoutError } from "../lib/errors.ts";
import type {
  Agency,
  IssueKind,
  IssueReason,
  ListingRow,
} from "../lib/types.ts";
import * as agency1 from "./agencies/agency1.ts";
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
  tooManyPagesFailed,
} from "./removal.ts";
import { buildScope } from "./scope.ts";

process.loadEnvFile(".env");

// Requires Node 24 (native .ts and process.loadEnvFile, see scripts/.nvmrc)
const { supabaseAdmin } = await import("../lib/supabaseAdmin.ts");

// Agencies are scraped one after another. Add new agencies here!
const allAgencies: Agency[] = [mockdata, agency1];

// Optional flags for a limited test run. Without them everything runs as usual
//   --agency=mockdata          only scrape this agency
//   --municipality=Lerum       ignore the users' searches and scrape this municipality (all types). Can be repeated

function flagValues(name: string): string[] {
  const prefix = `--${name}=`;
  return process.argv
    .filter((arg) => arg.startsWith(prefix))
    .map((arg) => arg.slice(prefix.length));
}

const [agencyFlag] = flagValues("agency");
const agencies = agencyFlag
  ? allAgencies.filter(
      (a) => a.AGENCY.toLowerCase() === agencyFlag.toLowerCase(),
    )
  : allAgencies;

if (agencies.length === 0) {
  console.error(
    `Unknown agency "${agencyFlag}". Available: ${allAgencies.map((a) => a.AGENCY).join(", ")}`,
  );
  process.exit(1);
}

const municipalityFlags = flagValues("municipality");

// ---------------------- READ SEARCH PARAMS --------------------------
const { data: searchParams, error: searchError } = await supabaseAdmin
  .from("search_params")
  .select("user_id, property_types, municipalities");

if (searchError) {
  console.error("Failed to read search_params:", searchError);
  process.exit(1);
}

// ---------------------- BUILD SCOPE --------------------------
const { items, skipped } = buildScope(searchParams ?? []);
const scope = municipalityFlags.length
  ? [{ municipalities: municipalityFlags.sort(), propertyTypes: [] }]
  : items;

for (const userId of skipped) {
  console.warn(`Skipping search without a municipality (user ${userId})`);
}

if (scope.length === 0) {
  console.log("Nothing to scrape");
  process.exit(0);
}

console.log(`Scope: ${scope.length} distinct searches`);
console.log(JSON.stringify(scope, null, 2));

// ---------------------- SCRAPE + SAVE --------------------------
// Why the listings table would reject the row as a whole, or null. SAME LIMITS as the check constraints on listings (supabase/schema.sql; the database allows a larger ld_json, since jsonb::text adds spaces). The mappers already make single bad values null, this is for what cannot be nulled. A skipped row is not saved and not marked as removed
const MAX_URL_LENGTH = 500;
const MAX_LD_JSON_BYTES = 200_000;

function rowProblem(row: ListingRow): string | null {
  if (!row.url.startsWith("https://") || row.url.length > MAX_URL_LENGTH) {
    return `url is not https or longer than ${MAX_URL_LENGTH}`;
  }
  const bytes = Buffer.byteLength(JSON.stringify(row.ld_json));
  if (bytes > MAX_LD_JSON_BYTES) {
    return `ld_json is ${bytes} bytes, max ${MAX_LD_JSON_BYTES}`;
  }
  return null;
}

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
  details: { [key: string]: Json | undefined },
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
      const { failedUrls } = result;
      // A row the listings table would reject fails the whole batch upsert, so it is skipped like a failed page
      const rows = result.rows.filter((row) => {
        const problem = rowProblem(row);
        if (problem) {
          console.warn(`${agency.AGENCY}: skipping ${row.url}: ${problem}`);
          failedUrls.push(row.url);
        }
        return !problem;
      });

      if (rows.length > 0) {
        const { error } = await supabaseAdmin
          .from("listings")
          .upsert(rows, { onConflict: "agency,external_id" });
        // Failure F4: the save failed, logged in the backlog
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

// A non-zero exit code makes a scheduled run show up as failed, so GitHub notifies. Used for unexpected errors and issues the admin must hear about, not for a single failed agency run.
if (failedAgencies > 0 || needsAttention > 0) process.exitCode = 1;
