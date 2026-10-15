import type { ScopeItem, SearchParamsRow } from "../lib/types.ts";

// Builds the scrape scope from every user's search_params.
// One scope item per distinct search. Searches without a place are skipped, otherwise a whole agency site would be scraped.
// The scope is a list of searches to be done on each agency's site, i.e. All houses in municipaly A and all apartments in area B

export function buildScope(searchParams: SearchParamsRow[]): {
  items: ScopeItem[];
  skipped: string[];
} {
  const items: ScopeItem[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const sp of searchParams) {
    const municipalities = sp.municipalities ?? [];
    const areas = sp.areas ?? [];

    // It is mandatory to have eiether a municipaly or an area targeted for scrapning to occur
    if (municipalities.length === 0 && areas.length === 0) {
      skipped.push(sp.user_id);
      continue;
    }

    const item: ScopeItem = {
      municipalities: [...municipalities].sort(),
      areas: [...areas].sort(),
      propertyTypes: [...(sp.property_types ?? [])].sort(),
    };

    // Identical searches only need to be scraped once
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);

    items.push(item);
  }

  return { items, skipped };
}
