// This file decides which listings are "removed" after a scrape.
// Agency specific checks (is the page healthy?) live in agencies/, the universal rules live here.
// The db client is passed in, because run.ts loads .env AFTER its static imports.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActiveListing, ScopeItem } from "../lib/types.ts";

// Failure F3: this share (or more) of the listing pages failed -> the scraper is probably broken
export const FAILED_DETAIL_SHARE = 0.5;

// Suspicious: at least this many listings would be removed AND more than this share of the active ones
export const SUSPICIOUS_MIN_REMOVALS = 5;
export const SUSPICIOUS_MIN_SHARE = 0.5;

const PAGE_SIZE = 1000; // Supabase returns at most 1000 rows per request

// Same rules as match_user_listings: type (empty = all types) AND (municipality OR area)
function isInScope(listing: ActiveListing, scope: ScopeItem[]): boolean {
  return scope.some((item) => {
    const typeOk =
      item.propertyTypes.length === 0 ||
      (listing.property_type !== null &&
        item.propertyTypes.includes(listing.property_type));
    const placeOk =
      (listing.municipality !== null &&
        item.municipalities.includes(listing.municipality)) ||
      (listing.area !== null && item.areas.includes(listing.area));
    return typeOk && placeOk;
  });
}

// All active listings of an agency that the current scope covers.
// Call this BEFORE the upsert, so new listings do not inflate the count
export async function fetchActiveInScope(
  db: SupabaseClient,
  agency: string,
  scope: ScopeItem[],
): Promise<ActiveListing[]> {
  const active: ActiveListing[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from("listings")
      .select("id, external_id, url, municipality, area, property_type")
      .eq("agency", agency)
      .is("removed_at", null)
      .order("id")
      .range(from, from + PAGE_SIZE - 1)
      .overrideTypes<ActiveListing[]>();
    if (error) throw error;

    active.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return active.filter((listing) => isInScope(listing, scope));
}

// Active listings the scraper did not see. A listing whose page failed to load is NOT missing, we just could not read it, so it is left alone
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

// Failure F3: too many listing pages failed
export function tooManyPagesFailed(
  okCount: number,
  failedCount: number,
): boolean {
  const total = okCount + failedCount;
  return failedCount > 0 && failedCount / total >= FAILED_DETAIL_SHARE;
}

// Suspicious: too many of the active listings would disappear at once.
// Both limits are needed: a narrow scope with 3 listings can in reality drop 2 in a day
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
  db: SupabaseClient,
  listings: ActiveListing[],
  removedAt: string,
): Promise<void> {
  if (listings.length === 0) return;

  const { error } = await db
    .from("listings")
    .update({ removed_at: removedAt })
    .in(
      "id",
      listings.map((l) => l.id),
    )
    .is("removed_at", null); // Never overwrite an earlier removed_at, days need to be counted for permanent delete from database.
  if (error) throw error;
}
