import { chromium } from "playwright";

// Fetch dotenv variables
process.loadEnvFile(".env");

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

// Make sure URLs are unique, no duplicates, and built absolute URLs for Playwright to use
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

    // Save result
    results.push(data);

    console.log(`${url}: ${data.streetAddress}`);
    // .../objekt/1063: Bäckvägen 29
    // .../objekt/1027: Bergsgläntan 4
    // .../objekt/1013: Tallvägen 29
  } catch (error) {
    console.error(`Failed on ${data.path}:`);
  }
}

// Render out raw data
console.log(JSON.stringify(results, null, 2));

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
