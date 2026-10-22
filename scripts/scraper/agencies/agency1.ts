import type { Browser } from "playwright";
import { ScrapeLayoutError } from "../../lib/errors.ts";
import { countyOf, slugify } from "../../lib/swedishPlaces.ts";
import type { ListingRow, ScopeItem } from "../../lib/types.ts";
import { mapListing, type Agency1LdJson } from "../mappers/agency1.ts";

// Env is read inside the functions, so it works even though run.ts
// loads the .env file after the static imports have run.
// Agency1 is an alias for the real agency name due to copyright & permissions.
export const AGENCY = "Agency1";

// Fetch base-URL from dotenv. Base-URL is put it dotenv due to copyright & permissions.
function baseUrl(): string {
  const base = process.env.BASE_PATH_AGENCY1;
  if (!base) throw new Error("Missing BASE_PATH_AGENCY1");
  return base;
}

// Our property_type -> the site's type. The first chosen type becomes the path
// segment (slug), every type is also a filter value (?t=, comma separated)
const TYPES: Record<string, { slug: string; label: string }> = {
  villa: { slug: "hus", label: "Villa" },
  radhus: { slug: "radhus", label: "Radhus" },
  tomt: { slug: "tomt", label: "Tomt" },
  lagenhet: { slug: "lagenhet", label: "Lägenhet" },
};

// Path segment used when the user has not chosen any type
const ALL_TYPES = "bostad";

// --------------- Fetch county for chosen municipality ----------------
// The site's places are "county/municipality[/area]"
function municipalityPlace(name: string): string | null {
  const county = countyOf(name);
  return county ? `${slugify(county)}/${slugify(name)}` : null;
}

// -------------- URL BUILDER ---------------
// One search URL per scope item: /{type}/{county}/{municipality}/?t=<types>&l=<places>
// Page 1 has no page parameter; later pages add &p=1, &p=2 ... (see pageUrl)
export function buildUrls(scope: ScopeItem[]): string[] {
  const urls = scope
    .map((item) => {
      const types = [
        ...new Set(
          item.propertyTypes.flatMap((t) => (TYPES[t] ? [TYPES[t]] : [])),
        ),
      ];

      // The user chose types, but none of them exist on this site
      if (item.propertyTypes.length > 0 && types.length === 0) return null;

      // TODO areas: need "county/municipality/area" slugs, so they are skipped for now
      const places = item.municipalities
        .map((m) => {
          const place = municipalityPlace(m);
          if (!place) console.warn(`No county known for municipality "${m}"`);
          return place;
        })
        .filter((p): p is string => p !== null);

      // Nothing searchable left: better no search than the whole country
      if (places.length === 0) return null;

      const [place, ...morePlaces] = places;
      const query: string[] = [];
      // Commas are kept literal, as the site writes them itself
      if (types.length > 1) {
        query.push(
          `t=${types.map((t) => encodeURIComponent(t.label)).join(",")}`,
        );
      }
      if (morePlaces.length > 0) query.push(`l=${morePlaces.join(",")}`);

      const path = `${types[0]?.slug ?? ALL_TYPES}/${place}/`;
      return (
        new URL(path, baseUrl()).href +
        (query.length ? `?${query.join("&")}` : "")
      );
    })
    .filter((url): url is string => url !== null);

  return [...new Set(urls)];
}

// Page 0 is the url itself, page n adds p=n (35 hits per page)
export function pageUrl(searchUrl: string, page: number): string {
  if (page === 0) return searchUrl;
  return searchUrl + (searchUrl.includes("?") ? "&" : "?") + `p=${page}`;
}

// First path segment of the listings we keep. The site also returns other kinds
// (holiday homes, new-build projects) that we have no property_type for
const LISTING_SEGMENTS = new Set([
  "hus",
  "radhus",
  "tomt",
  "bostadsratt",
  "lagenhet",
]);

// Safety stop for the page loop, the site has 35 hits per page
const MAX_PAGES = 100;

type Hit = { id: number; href: string; isNew: boolean };

// -------------- Scraper, find listings --------------
export async function scrape(
  scope: ScopeItem[],
  browser: Browser,
): Promise<{ rows: ListingRow<Agency1LdJson>[]; failedUrls: string[] }> {
  const page = await browser.newPage();
  const failedUrls: string[] = [];

  try {
    // 1. Collect listing URLs from every search page.
    // A failing search page throws: the result would be incomplete
    const listings = new Map<number, { url: string; isNew: boolean }>(); // external_id -> url and new-build flag

    for (const searchUrl of buildUrls(scope)) {
      const hits = new Map<number, { url: string; isNew: boolean }>();
      let expected = 0;

      for (let n = 0; n < MAX_PAGES; n++) {
        const url = pageUrl(searchUrl, n);
        const response = await page.goto(url);

        // Failure F1: a bad status means we got an error page, not a search result
        if (!response?.ok()) {
          throw new Error(`Search page ${url} returned ${response?.status()}`);
        }

        // Failure F2: the site always renders the hit wrapper with the total count,
        // also for 0 hits. No wrapper = not the page we expect.
        // This is what tells a true 0 apart from a broken scraper
        const wrapper = page.locator("#searchHitsWrapper");
        try {
          await wrapper.waitFor({ timeout: 5000 });
        } catch {
          throw new ScrapeLayoutError(`No hit wrapper on ${url}`);
        }
        // Number(null) and Number("") are both 0, which would look like a true 0 hits
        const raw = await wrapper.getAttribute("data-hitcount");
        expected = raw === null || raw.trim() === "" ? NaN : Number(raw);
        if (!Number.isInteger(expected) || expected < 0) {
          throw new ScrapeLayoutError(`Unreadable hit count on ${url}`);
        }

        const found: Hit[] = await page
          .locator("a.search-hit__link[data-targetid]")
          .evaluateAll((links) =>
            links.map((a) => ({
              id: Number(a.getAttribute("data-targetid")),
              href: a.getAttribute("href") ?? "",
              // The card has a "new-prod" label on new-build listings
              isNew: a.querySelector(".search-hit__label.new-prod") !== null,
            })),
          );

        const before = hits.size;
        for (const { id, href, isNew } of found) {
          if (id && href) {
            hits.set(id, { url: new URL(href, baseUrl()).href, isNew });
          }
        }

        // All hits collected, or a page without new hits (beyond the last page)
        if (hits.size >= expected || hits.size === before) break;
      }

      // Failure (F2): fewer hits than the site claims = incomplete result
      if (hits.size < expected) {
        throw new ScrapeLayoutError(
          `Found ${hits.size} hits but the site reports ${expected} on ${searchUrl}`,
        );
      }

      for (const [id, hit] of hits) {
        const segment = new URL(hit.url).pathname.split("/")[1] ?? "";
        if (LISTING_SEGMENTS.has(segment)) listings.set(id, hit);
      }
    }

    // ------------------ OBJECT PAGES --------------------
    // 2. Fetch ld+json on every listing page. One failing page does not stop the rest
    const rows: ListingRow<Agency1LdJson>[] = [];
    const seenAt = new Date().toISOString();

    for (const [externalId, { url, isNew }] of listings) {
      try {
        const response = await page.goto(url);
        if (!response?.ok()) throw new Error(`Status ${response?.status()}`);

        // The page has many ld+json blocks (similar listings, FAQ, breadcrumbs).
        const texts = await page
          .locator('script[type="application/ld+json"]')
          .allTextContents();
        const data = texts
          .map(
            (text) => JSON.parse(text) as Agency1LdJson & { "@type"?: string },
          )
          // Target the actual listing
          .find(
            (d) =>
              d["@type"] === "RealEstateListing" &&
              d.product?.mpn === String(externalId),
          );
        if (!data) throw new ScrapeLayoutError(`No listing ld+json on ${url}`);

        // Facts that are not in the ld+json: the "Typ:" and "Månadsavgift:" lines in the
        // fact list, e.g. "Radhus, 2-plans radhus" and "4 100 kr". Null if a line is missing
        const lines = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll("li.info--icon"));
          const read = (label: string) =>
            items
              .find((li) => (li.textContent ?? "").trim().startsWith(label))
              ?.textContent?.replace(label, "")
              .trim() || null;
          return { type: read("Typ:"), fee: read("Månadsavgift:") };
        });

        rows.push({
          agency: AGENCY,
          external_id: externalId,
          url,
          ld_json: data,
          last_seen_at: seenAt,
          removed_at: null, // A listing that is seen again is not "removed"
          ...mapListing(data, {
            listingType: lines.type,
            monthlyFee: lines.fee,
            isNewConstruction: isNew,
          }), // Normalized columns used for matching
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
