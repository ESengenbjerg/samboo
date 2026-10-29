import type { ScopeItem, SearchParamsRow } from "../lib/types.ts";

// Builds the scrape scope from every user's search_params.
// One scope item per distinct search. Searches without a place are skipped, otherwise a whole agency site would be scraped.
// The scope is a list of searches to be done on each agency's site, i.e. All houses in municipality A and all apartments in municipality B

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

    // A municipality is mandatory for scraping to occur. Areas only narrow a municipality down (see validate_search_places()),
    // so a search with areas but no municipality is not valid and is skipped
    if (municipalities.length === 0) {
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
