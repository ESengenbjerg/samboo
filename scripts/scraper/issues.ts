// The backlog (scrape_issues table): failed and suspicious runs per agency, see docs/removed_listings.md.

// The db client is passed in, because run.ts loads .env AFTER its static imports.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../shared/database.types.ts";
import type { IssueKind, IssueReason, ScrapeIssue } from "../lib/types.ts";

// failed: notify when it has happened in this many runs in a row (or at once for F2)
export const NOTIFY_FAILED_AFTER_RUNS = 2;

const COLUMNS = "id, agency, kind, reason, occurrences, notified_at";

// Opens a new issue, or raises occurrences on the one that is already open
export async function recordIssue(
  db: SupabaseClient<Database>,
  agency: string,
  kind: IssueKind,
  reason: IssueReason,
  details: { [key: string]: Json | undefined },
): Promise<ScrapeIssue> {
  const { data: open, error: readError } = await db
    .from("scrape_issues")
    .select(COLUMNS)
    .eq("agency", agency)
    .eq("kind", kind)
    .eq("status", "open")
    .maybeSingle();
  if (readError) throw readError;

  const query = open
    ? db
        .from("scrape_issues")
        .update({
          reason,
          details,
          occurrences: open.occurrences + 1,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", open.id)
    : db.from("scrape_issues").insert({ agency, kind, reason, details });

  // <ScrapeIssue> narrows reason from text to IssueReason: we just wrote it from a typed argument
  const { data, error } = await query.select(COLUMNS).single<ScrapeIssue>();
  if (error) throw error;
  return data;
}

// Closes open issues, called when a run no longer has the problem
export async function resolveIssues(
  db: SupabaseClient<Database>,
  agency: string,
  kinds: IssueKind[],
): Promise<void> {
  const { error } = await db
    .from("scrape_issues")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("agency", agency)
    .eq("status", "open")
    .in("kind", kinds);
  if (error) throw error;
}

// Admin should hear about it: suspicious at once, failed after 2 runs in a row, F2 at once
export function shouldNotify(issue: ScrapeIssue): boolean {
  if (issue.notified_at !== null) return false; // Only once per open issue
  if (issue.kind === "suspicious") return true;
  return issue.reason === "F2" || issue.occurrences >= NOTIFY_FAILED_AFTER_RUNS;
}

// Admin is notified through GitHub, an Actions annotation + a failing exit code (see run.ts)
export async function notifyAdmin(
  db: SupabaseClient<Database>,
  issue: ScrapeIssue,
  message: string,
): Promise<void> {
  console.error(
    `::error title=Scrape ${issue.kind} (${issue.agency})::${message}`,
  );

  const { error } = await db
    .from("scrape_issues")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", issue.id);
  if (error) throw error;
}
