import type { Browser } from "playwright";
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

// One search URL per scope item. The site mixes municipalities and areas in one "area" filter
export function buildUrls(scope: ScopeItem[]): string[] {
  const urls = scope
    .map((item) => {
      const categories = item.propertyTypes.flatMap((t) => CATEGORIES[t] ?? []);

      // The user chose types, but none of them exist on this site
      if (item.propertyTypes.length > 0 && categories.length === 0) return null;

      const url = new URL(baseUrl());
      for (const place of [...item.municipalities, ...item.areas]) {
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
): Promise<{ rows: ListingRow<MockdataLdJson>[]; failedUrls: string[] }> {
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
    const rows: ListingRow<MockdataLdJson>[] = [];
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
          ld_json: data,
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

// import { chromium } from "playwright";
// import { mapListing } from "../mappers/mockdata.ts";

// // Fetch dotenv variables
// process.loadEnvFile(".env");

// // The mock data has no agency info, so use a hardcoded placeholder
// const AGENCY = "mockdata";

// // Admin Supabase connection (service role, bypasses RLS). Dynamic import so it runs AFTER the env is loaded.
// // THIS REQUIRES NODE v.25, otherwise an error will occur
// const { supabaseAdmin } = await import("../../../lib/supabaseAdmin.ts");

// // Use Google Chrome
// const browser = await chromium.launch({ headless: true, slowMo: 300 });

// // Open a new Google Chrome window
// const page = await browser.newPage();

// // Go to result page
// await page.goto(
//   `${process.env.BASE_PATH_MOCK_DATA}?area=Partille`, // For wider result
//   // ?area=Partille&category=villa`,
// );

// // Fetch result links in an array
// const links = await page.locator('a[href^="/objekt/"]').all();
// const objects = [];

// for (const link of links) {
//   const href = await link.getAttribute("href");

//   // Extra protection: Only include URLs with "/objekt/" in it
//   if (href?.includes("/objekt/")) {
//     objects.push(href);
//   }
// }

// // Make sure URLs are unique (no duplicates) and build absolute URLs for Playwright to use
// const urls = [...new Set(objects)].map(
//   (p) => new URL(p, process.env.BASE_PATH_MOCK_DATA).href,
// );

// //console.log(urls); // Returns correct URLs

// const results = [];

// for (const url of urls) {
//   try {
//     // Go to each page
//     await page.goto(url);

//     // Fetch ld+json on each page
//     const text = await page
//       .locator('script[type="application/ld+json"]')
//       .textContent();

//     // Parse
//     const data = JSON.parse(text);

//     // Build a row matching the listings table
//     results.push({
//       agency: AGENCY,
//       external_id: Number(data.path.split("/").pop()), // "/objekt/1063" -> 1063
//       url,
//       ld_json: data,
//       last_seen_at: new Date().toISOString(),
//       removed_at: null, // A listing that is seen again is not "removed"
//       ...mapListing(data), // Normalized columns used for matching
//     });

//     console.log(`${url}: ${data.streetAddress}`);
//     // .../objekt/1063: Bäckvägen 29
//     // .../objekt/1027: Bergsgläntan 4
//     // .../objekt/1013: Tallvägen 29
//   } catch (error) {
//     console.error(`Failed on ${url}:`, error);
//   }
// }

// // Insert new listings, update existing ones (matched on agency + external_id)
// const { error } = await supabaseAdmin
//   .from("listings")
//   .upsert(results, { onConflict: "agency,external_id" });

// if (error) {
//   console.error("Failed to save listings:", error);
// } else {
//   console.log(`Saved ${results.length} listings`);
// }
// // Tested and seems to work fine!

// // Example result from mockdata
// // {
// //   "@context": "https://schema.org",
// //   "@type": "SingleFamilyResidence",
// //   "path": "/objekt/1063",
// //   "category": "villa",
// //   "title": "Villa, Bäckvägen 29",
// //   "price": 5800000,
// //   "priceCurrency": "SEK",
// //   "monthlyFee": null,
// //   "rooms": 4,
// //   "livingArea": 127,
// //   "plotArea": 1556,
// //   "buildYear": 1961,
// //   "streetAddress": "Bäckvägen 29",
// //   "postalCode": "433 36",
// //   "addressLocality": "Partille",
// //   "district": "Partille",
// //   "municipality": "Partille",
// //   "geo": {
// //     "latitude": 57.73969,
// //     "longitude": 12.11584
// //   },
// //   "image": "https://example.com/placeholder/1063.jpg"
// // },

// // Close browser window
// await browser.close();

// // ---------------------- MATCH --------------------------
// // New listings may match existing users' search params
// const { data: newMatches, error: matchError } = await supabaseAdmin.rpc(
//   "match_user_listings",
// );

// if (matchError) {
//   console.error("Failed to match listings:", matchError);
// } else {
//   console.log(`${newMatches} new user matches`);
// }
