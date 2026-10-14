import { chromium } from "playwright";

// Fetch dotenv variables
process.loadEnvFile(".env");

// The mock data has no agency info, so use a hardcoded placeholder
const AGENCY = "mockdata";

// Admin Supabase connection (service role, bypasses RLS). Dynamic import so it runs AFTER the env is loaded.
// THIS REQUIRES NODE v.25, otherwise an error will occur
const { supabaseAdmin } = await import("../lib/supabaseAdmin.mjs");

// Use Google Chrome
const browser = await chromium.launch({ headless: false, slowMo: 300 });

// Open a new Google Chrome window
const page = await browser.newPage();

// Go to result page
await page.goto(
  `${process.env.BASE_PATH_MOCK_DATA}?area=Partille&category=villa`,
);

// Fetch result links in an array
const links = await page.locator('a[href^="/objekt/"]').all();
const objects = [];

for (const link of links) {
  const href = await link.getAttribute("href");

  // Extra protection: Only include URLs with "/objekt/" in it
  if (href?.includes("/objekt/")) {
    objects.push(href);
  }
}

// Make sure URLs are unique (no duplicates) and build absolute URLs for Playwright to use
const urls = [...new Set(objects)].map(
  (p) => new URL(p, process.env.BASE_PATH_MOCK_DATA).href,
);

//console.log(urls); // Returns correct URLs

const results = [];

for (const url of urls) {
  try {
    // Go to each page
    await page.goto(url);

    // Fetch ld+json on each page
    const text = await page
      .locator('script[type="application/ld+json"]')
      .textContent();

    // Parse
    const data = JSON.parse(text);

    // Build a row matching the listings table
    results.push({
      agency: AGENCY,
      external_id: Number(data.path.split("/").pop()), // "/objekt/1063" -> 1063
      url,
      ld_json: data,
      last_seen_at: new Date().toISOString(),
      removed_at: null, // A listing that is seen again is not "removed"
    });

    console.log(`${url}: ${data.streetAddress}`);
    // .../objekt/1063: Bäckvägen 29
    // .../objekt/1027: Bergsgläntan 4
    // .../objekt/1013: Tallvägen 29
  } catch (error) {
    console.error(`Failed on ${url}:`, error);
  }
}

// Insert new listings, update existing ones (matched on agency + external_id)
const { error } = await supabaseAdmin
  .from("listings")
  .upsert(results, { onConflict: "agency,external_id" });

if (error) {
  console.error("Failed to save listings:", error);
} else {
  console.log(`Saved ${results.length} listings`);
}
// Tested and seems to work fine!

// Example result from mockdata
// {
//   "@context": "https://schema.org",
//   "@type": "SingleFamilyResidence",
//   "path": "/objekt/1063",
//   "category": "villa",
//   "title": "Villa, Bäckvägen 29",
//   "price": 5800000,
//   "priceCurrency": "SEK",
//   "monthlyFee": null,
//   "rooms": 4,
//   "livingArea": 127,
//   "plotArea": 1556,
//   "buildYear": 1961,
//   "streetAddress": "Bäckvägen 29",
//   "postalCode": "433 36",
//   "addressLocality": "Partille",
//   "district": "Partille",
//   "municipality": "Partille",
//   "geo": {
//     "latitude": 57.73969,
//     "longitude": 12.11584
//   },
//   "image": "https://example.com/placeholder/1063.jpg"
// },

// Close browser window
await browser.close();
