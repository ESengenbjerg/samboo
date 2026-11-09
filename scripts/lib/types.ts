import type { Browser } from "playwright";

import type { Enums, Tables } from "../../shared/database.types.ts";

// The columns of search_params that the scraper reads
export type SearchParamsRow = Pick<
  Tables<"search_params">,
  "user_id" | "property_types" | "municipalities" | "areas"
>;

// Our own property_type values: the database enum public.property_type (listings.property_type)
export type PropertyType = Enums<"property_type">;

// One distinct search to be done on each agency's site
export type ScopeItem = {
  municipalities: string[];
  areas: string[];
  propertyTypes: PropertyType[];
};

// Normalized columns on the listings table that come from the agency's data.
// Every mapper must set all of them (null when the agency has no value), so the row type is used, not the insert type
export type MappedListing = Pick<
  Tables<"listings">,
  | "property_type"
  | "municipality"
  | "area"
  | "address"
  | "image_url"
  | "description"
  | "price"
  | "rooms"
  | "floor_level"
  | "latitude"
  | "longitude"
  | "monthly_fee"
  | "living_area"
  | "plot_area"
  | "build_year"
  | "is_new_construction"
>;

// A row ready to be upserted into listings
export type ListingRow = MappedListing &
  Pick<
    Tables<"listings">,
    "agency" | "external_id" | "url" | "ld_json" | "last_seen_at" | "removed_at"
  >;

// What every agency module has to export (see agencies/)
export type Agency = {
  AGENCY: string;
  buildUrls: (scope: ScopeItem[]) => string[];
  scrape: (
    scope: ScopeItem[],
    browser: Browser,
  ) => Promise<{ rows: ListingRow[]; failedUrls: string[] }>;
};

// ---------------------- Types for removed listings and backlog problems --------------------------

// The columns of an active listing that the removal check needs
export type ActiveListing = Pick<
  Tables<"listings">,
  "id" | "external_id" | "url" | "municipality" | "property_type"
>;

// Why a run was flagged. F1-F4 are failures, "mass_removal" is the suspicious case.
// IssueKind is the database enum public.scrape_issue_kind.
// IssueReason stays here: the database does not limit reason, the list belongs to the scraper's rules
export type IssueKind = Enums<"scrape_issue_kind">;
export type IssueReason = "F1" | "F2" | "F3" | "F4" | "mass_removal";

// The columns of scrape_issues (the backlog) that the scraper reads (COLUMNS in scraper/issues.ts)
export type ScrapeIssue = Omit<
  Pick<Tables<"scrape_issues">, "id" | "agency" | "kind" | "reason" | "occurrences" | "notified_at">,
  "reason"
> & { reason: IssueReason };
