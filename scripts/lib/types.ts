import type { Browser } from "playwright";

// Row shape of search_params, as far as the scraper reads it
export type SearchParamsRow = {
  user_id: string;
  property_types: string[] | null;
  municipalities: string[] | null;
  areas: string[] | null;
};

// Our own property_type values (listings.property_type)
export type PropertyType =
  | "villa"
  | "radhus"
  | "tomt"
  | "lagenhet"
  | "fritidshus"
  | "other";

// One distinct search to be done on each agency's site
export type ScopeItem = {
  municipalities: string[];
  areas: string[];
  propertyTypes: string[];
};

// Normalized columns on the listings table that come from the agency's data
export type MappedListing = {
  property_type: PropertyType | null;
  municipality: string | null;
  area: string | null;
  address: string | null;
  image_url: string | null;
  description: string | null;
  price: number | null;
  rooms: number | null;
  floor_level: number | null;
  latitude: number | null;
  longitude: number | null;
  monthly_fee: number | null;
  living_area: number | null;
  plot_area: number | null;
  is_new_construction: boolean;
};

// A row ready to be upserted into listings
export type ListingRow<LdJson = unknown> = MappedListing & {
  agency: string;
  external_id: number;
  url: string;
  ld_json: LdJson;
  last_seen_at: string;
  removed_at: string | null;
};

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
export type ActiveListing = {
  id: number | string;
  external_id: number;
  url: string;
  municipality: string | null;
  area: string | null;
  property_type: PropertyType | null;
};

// Why a run was flagged. F1-F4 are failures, "mass_removal" is the suspicious case
export type IssueKind = "failed" | "suspicious";
export type IssueReason = "F1" | "F2" | "F3" | "F4" | "mass_removal";

// A row in scrape_issues (the backlog)
export type ScrapeIssue = {
  id: number | string;
  agency: string;
  kind: IssueKind;
  reason: IssueReason;
  occurrences: number;
  notified_at: string | null;
};
