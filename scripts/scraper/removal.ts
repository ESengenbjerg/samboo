// Decides which listings are "removed" after a scrape. Rules and thresholds: docs/removed_listings.md
// The db client is passed in, because run.ts loads .env AFTER its static imports.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../shared/database.types.ts";
import type { ActiveListing, ScopeItem } from "../lib/types.ts";

// Failure F3: share of listing page that may fail
export const FAILED_DETAIL_SHARE = 0.5;

// Suspicious: at least this many removals AND more than this share of the active listings
export const SUSPICIOUS_MIN_REMOVALS = 5;
export const SUSPICIOUS_MIN_SHARE = 0.5;

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request

// Type (empty = all types) AND municipality. Areas do not count: the scraper fetches whole municipalities
function isInScope(listing: ActiveListing, scope: ScopeItem[]): boolean {
  return scope.some((item) => {
    const typeOk =
      item.propertyTypes.length === 0 ||
      item.propertyTypes.includes(listing.property_type);
    const placeOk =
      listing.municipality !== null &&
      item.municipalities.includes(listing.municipality);
    return typeOk && placeOk;
  });
}

// Call this BEFORE the upsert, so new listings do not inflate the count
export async function fetchActiveInScope(
  db: SupabaseClient<Database>,
  agency: string,
  scope: ScopeItem[],
): Promise<ActiveListing[]> {
  const active: ActiveListing[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from("listings")
      .select("id, external_id, url, municipality, property_type")
      .eq("agency", agency)
      .is("removed_at", null)
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    active.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return active.filter((listing) => isInScope(listing, scope));
}

// Active listings not seen in this run. A listing whose page failed to load is left alone
export function findMissing(
  active: ActiveListing[],
  seenExternalIds: Set<number>,
  failedUrls: string[],
): ActiveListing[] {
  const failed = new Set(failedUrls);
  return active.filter(
    (listing) =>
      !seenExternalIds.has(listing.external_id) && !failed.has(listing.url),
  );
}

// Failure F3
export function tooManyPagesFailed(
  okCount: number,
  failedCount: number,
): boolean {
  const total = okCount + failedCount;
  return failedCount > 0 && failedCount / total >= FAILED_DETAIL_SHARE;
}

// Suspicious
export function isSuspiciousRemoval(
  activeCount: number,
  removeCount: number,
): boolean {
  return (
    removeCount >= SUSPICIOUS_MIN_REMOVALS &&
    removeCount / activeCount > SUSPICIOUS_MIN_SHARE
  );
}

export async function markRemoved(
  db: SupabaseClient<Database>,
  listings: ActiveListing[],
  removedAt: string,
): Promise<void> {
  if (listings.length === 0) return;

  // Never overwrite an earlier removed_at: the 10 days to purge are counted from it
  const { error } = await db
    .from("listings")
    .update({ removed_at: removedAt })
    .in(
      "id",
      listings.map((l) => l.id),
    )
    .is("removed_at", null);
  if (error) throw error;
}
