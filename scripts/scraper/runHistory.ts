// Run history (scrape_runs table): one row per run and agency, so the admin view can show how each agency is doing.
// Problems and their details are in scrape_issues (see issues.ts), this is only the outcome and the counts.

// The db client is passed in, because run.ts loads .env AFTER its static imports.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types.ts";
import type { AgencyRun } from "../lib/types.ts";

// Same limit as the check constraint scrape_runs_message_length
const MAX_MESSAGE_LENGTH = 2000;

// Set by GitHub Actions, so a row can be traced to its log. Missing in a local run
const githubRunId = Number(process.env.GITHUB_RUN_ID) || null;

// Starts as "error": if the agency throws before an outcome is set, that is what happened
export function newAgencyRun(): AgencyRun {
  return {
    outcome: "error",
    reason: null,
    saved: 0,
    failedPages: 0,
    removed: 0,
    message: null,
  };
}

// Saves the row. Never throws: missing history must not stop the other agencies. Returns false if the save failed
export async function recordRun(
  db: SupabaseClient<Database>,
  runStartedAt: string,
  agency: string,
  startedAt: string,
  run: AgencyRun,
): Promise<boolean> {
  const { error } = await db.from("scrape_runs").insert({
    run_started_at: runStartedAt,
    github_run_id: githubRunId,
    agency,
    started_at: startedAt,
    outcome: run.outcome,
    reason: run.reason,
    saved: run.saved,
    failed_pages: run.failedPages,
    removed: run.removed,
    message: run.message?.slice(0, MAX_MESSAGE_LENGTH) ?? null,
  });
  if (error) {
    console.error(`${agency}: could not save run history:`, error);
    return false;
  }
  return true;
}
