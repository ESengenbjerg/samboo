import type { Browser } from "playwright";
import type { Json } from "../../../shared/database.types.ts";
import { ScrapeLayoutError } from "../../lib/errors.ts";
import type { ListingRow, ScopeItem } from "../../lib/types.ts";
import { mapListing, type MockdataLdJson } from "../mappers/mockdata.ts";

// Env is read inside the functions, so it works even though run.ts
// loads the .env file after the static imports have run.
export const AGENCY = "mockdata";

function baseUrl(): string {
  const base = process.env.BASE_PATH_MOCK_DATA;
  if (!base) throw new Error("Missing BASE_PATH_MOCK_DATA");
  return base;
}

// Our property_type -> the categories the specific site uses in its search
const CATEGORIES: Record<string, string[]> = {
  villa: ["villa"],
  radhus: ["radhus", "parhus"],
  tomt: ["tomt"],
  lagenhet: ["lagenhet"],
};

// One search URL per scope item. The site calls its place filter "area"
export function buildUrls(scope: ScopeItem[]): string[] {
  const urls = scope
    .map((item) => {
      const categories = item.propertyTypes.flatMap((t) => CATEGORIES[t] ?? []);

      // The user chose types, but none of them exist on this site
      if (item.propertyTypes.length > 0 && categories.length === 0) return null;

      const url = new URL(baseUrl());
      for (const place of item.municipalities) {
        url.searchParams.append("area", place);
      }
      for (const category of categories) {
        url.searchParams.append("category", category);
      }
      return url.href;
    })
    .filter((url): url is string => url !== null);

  return [...new Set(urls)];
}

export async function scrape(
  scope: ScopeItem[],
  browser: Browser,
): Promise<{ rows: ListingRow[]; failedUrls: string[] }> {
  const page = await browser.newPage();
  const failedUrls: string[] = [];

  try {
    // 1. Collect listing URLs from every search page.
    // A failing search page throws: the result would be incomplete
    const listingUrls = new Set<string>();

    for (const searchUrl of buildUrls(scope)) {
      const response = await page.goto(searchUrl);

      // Failure F1: a bad status means we got an error page, not a search result
      if (!response?.ok()) {
        throw new Error(
          `Search page ${searchUrl} returned ${response?.status()}`,
        );
      }

      // Failure F2: the site always shows a result counter, also for 0 hits
      // (data-count="0" plus a "no-results" text). No counter = not the page we expect.
      // This is what tells a true 0 apart from a broken scraper
      const counter = page.locator('[data-testid="result-count"]');
      try {
        await counter.waitFor({ timeout: 5000 });
      } catch {
        throw new ScrapeLayoutError(`No result counter on ${searchUrl}`);
      }
      // Number(null) and Number("") are both 0, which would look like a true 0 hits
      const raw = await counter.getAttribute("data-count");
      const expected = raw === null || raw.trim() === "" ? NaN : Number(raw);
      if (!Number.isInteger(expected) || expected < 0) {
        throw new ScrapeLayoutError(
          `Unreadable result counter on ${searchUrl}`,
        );
      }

      const hrefs = await page
        .locator('a[href^="/objekt/"]')
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));

      // CHANGED: collected per page so it can be checked
      const pageUrls = new Set<string>();
      for (const href of hrefs) {
        if (href?.includes("/objekt/")) {
          pageUrls.add(new URL(href, baseUrl()).href);
        }
      }

      // Failure (F2): fewer links than the site claims (e.g. pagination) = incomplete result
      if (pageUrls.size < expected) {
        throw new ScrapeLayoutError(
          `Found ${pageUrls.size} links but the site reports ${expected} on ${searchUrl}`,
        );
      }

      for (const url of pageUrls) listingUrls.add(url);
    }

    // 2. Fetch ld+json on every listing page. One failing page does not stop the rest
    const rows: ListingRow[] = [];
    const seenAt = new Date().toISOString();

    for (const url of listingUrls) {
      try {
        await page.goto(url);

        const text = await page
          .locator('script[type="application/ld+json"]')
          .textContent();
        const data: MockdataLdJson = JSON.parse(text ?? "");

        rows.push({
          agency: AGENCY,
          external_id: Number(data.path.split("/").pop()), // "/objekt/1063" -> 1063
          url,
          // Parsed from JSON text, so always valid JSON. The type has unknown fields on purpose
          ld_json: data as Json,
          last_seen_at: seenAt,
          removed_at: null, // A listing that is seen again is not "removed"
          ...mapListing(data), // Normalized columns used for matching
        });
      } catch (error) {
        failedUrls.push(url);
        console.error(`Failed on ${url}:`, error);
      }
    }

    return { rows, failedUrls };
  } finally {
    await page.close();
  }
}
