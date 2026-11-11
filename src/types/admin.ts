import type { Enums } from "@shared/database.types";
import type { RpcRow } from "@shared/db";

// Outcome of one scraper run for one agency, the database enum public.scrape_run_outcome
export type ScrapeRunOutcome = Enums<"scrape_run_outcome">;

// One agency from admin_scrape_status(). The time and outcome columns are null when the agency has no run in the history (kept 90 days) or no listings yet
export type AgencyStatus = RpcRow<
  "admin_scrape_status",
  | "last_run_at"
  | "last_outcome"
  | "last_reason"
  | "last_message"
  | "last_ok_at"
  | "last_seen_at"
>;

// One open scrape issue from admin_open_issues(). Show description, not reason. notified_at is null until the GitHub alert is raised
export type OpenIssue = RpcRow<"admin_open_issues", "notified_at">;
