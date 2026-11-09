// The 50 fake listings as plain rows (no database calls). Same listings every run,
// only the dates follow the time the script runs.
import type { PropertyType as AnyPropertyType } from "../../lib/types.ts";
import { AGENCY, DAY } from "../setup/helpers.ts";

// The demo listings use every property type except "other"
type PropertyType = Exclude<AnyPropertyType, "other">;

export const PLACES = [
  {
    municipality: "Mölndal",
    lat: 57.655,
    lng: 12.014,
    areas: ["Centrum", "Krokslätt", "Kållered", "Lindome", "Fässberg"],
    streets: ["Kvarnbygatan", "Göteborgsvägen", "Bergmansgatan", "Toltorpsgatan", "Brogatan"],
  },
  {
    municipality: "Partille",
    lat: 57.739,
    lng: 12.106,
    areas: ["Centrum", "Sävedalen", "Öjersjö", "Jonsered", "Furulund"],
    streets: ["Gamla Kronvägen", "Mellbyvägen", "Brattåsvägen", "Ugglumsleden", "Kyrkvägen"],
  },
  {
    municipality: "Göteborg",
    lat: 57.708,
    lng: 11.974,
    areas: ["Majorna", "Linnéstaden", "Hisingen", "Frölunda", "Kortedala"],
    streets: ["Mariaplan", "Linnégatan", "Vågmästaregatan", "Tunnlandsgatan", "Runstavsgatan"],
  },
];

// Repeats every 10 listings, so each municipality gets every type
const TYPE_CYCLE: PropertyType[] = [
  "lagenhet", "lagenhet", "radhus", "villa", "lagenhet",
  "tomt", "radhus", "villa", "fritidshus", "lagenhet",
];

const DESCRIPTIONS: Record<PropertyType, string> = {
  lagenhet: "Ljus och välplanerad lägenhet med balkong i västerläge. Nära till kollektivtrafik, skola och service.",
  radhus: "Familjevänligt radhus med egen trädgård och uteplats. Lugnt område med lekplats i närheten.",
  villa: "Rymlig villa på stor tomt med garage. Renoverat kök och badrum, nära natur och badplats.",
  fritidshus: "Charmigt fritidshus i naturskönt läge. Perfekt för helger och somrar.",
  tomt: "Byggklar tomt i attraktivt läge med kommunalt vatten och avlopp indraget.",
};

// Listing numbers (1-50) with special roles
const UNKNOWN_PRICE = new Set([8, 23]); // price null ("unknown passes" the price filter)
export const REMOVED = new Set([4, 19]); // removed_at set: "Hittas inte" (liked by user 2)

export function buildListingRows(now: number) {
  // Small deterministic random generator, so every run gives the same listings
  let seed = 20261106;
  function random(): number {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }
  const between = (min: number, max: number) => min + random() * (max - min);
  const roundTo = (value: number, step: number) => Math.round(value / step) * step;

  return Array.from({ length: 50 }, (_, i) => {
    const n = i + 1;
    const place = PLACES[i < 20 ? 0 : i < 35 ? 1 : 2];
    const type = TYPE_CYCLE[i % 10];
    const area = place.areas[i % place.areas.length];
    const address = `${place.streets[(i * 3) % place.streets.length]} ${1 + ((i * 7) % 60)}`;
    const isNewConstruction = (type === "lagenhet" || type === "radhus") && i % 9 === 4;

    let price: number | null;
    let rooms: number | null = null;
    let livingArea: number | null = null;
    let monthlyFee: number | null = null;
    let floorLevel: number | null = null;
    let plotArea: number | null = null;

    switch (type) {
      case "lagenhet":
        rooms = Math.ceil(between(0.5, 4));
        livingArea = Math.round(25 + rooms * 18 + between(0, 12));
        price = roundTo(between(1_500_000, 4_500_000), 25_000);
        monthlyFee = roundTo(between(2_000, 6_500), 50);
        floorLevel = Math.floor(between(0, 7));
        break;
      case "radhus":
        rooms = Math.ceil(between(3, 6));
        livingArea = Math.round(80 + rooms * 10 + between(0, 20));
        price = roundTo(between(3_000_000, 6_000_000), 25_000);
        plotArea = Math.round(between(150, 350));
        break;
      case "villa":
        rooms = Math.ceil(between(4, 8));
        livingArea = Math.round(110 + rooms * 12 + between(0, 40));
        price = roundTo(between(4_500_000, 9_500_000), 50_000);
        plotArea = Math.round(between(600, 1_500));
        break;
      case "fritidshus":
        rooms = Math.ceil(between(2, 4));
        livingArea = Math.round(40 + rooms * 10);
        price = roundTo(between(1_000_000, 3_000_000), 25_000);
        plotArea = Math.round(between(800, 2_500));
        break;
      case "tomt":
        price = roundTo(between(800_000, 2_500_000), 25_000);
        plotArea = Math.round(between(700, 1_800));
        break;
    }
    if (UNKNOWN_PRICE.has(n)) price = null;

    const latitude = Number((place.lat + between(-0.02, 0.02)).toFixed(6));
    const longitude = Number((place.lng + between(-0.03, 0.03)).toFixed(6));
    const buildYear = isNewConstruction ? 2026 : type === "tomt" ? null : Math.round(between(1930, 2020));
    const description = DESCRIPTIONS[type];

    return {
      agency: AGENCY,
      external_id: n,
      url: `https://example.com/samboo-demo/${n}`,
      // One listing a little older than the next (about 9 hours), so "newest first" has something to sort
      created_at: new Date(now - i * 9 * 60 * 60 * 1000).toISOString(),
      last_seen_at: new Date(now).toISOString(),
      removed_at: REMOVED.has(n) ? new Date(now - 2 * DAY).toISOString() : null,
      property_type: type,
      municipality: place.municipality,
      area,
      address,
      price,
      rooms,
      living_area: livingArea,
      monthly_fee: monthlyFee,
      floor_level: floorLevel,
      plot_area: plotArea,
      build_year: buildYear,
      is_new_construction: isNewConstruction,
      latitude,
      longitude,
      description,
      image_url: null,
      // Same keys as the mockdata agency
      ld_json: {
        demo: true,
        category: type,
        municipality: place.municipality,
        district: area,
        streetAddress: address,
        price,
        rooms,
        livingArea,
        monthlyFee,
        floorLevel,
        plotArea,
        buildYear,
        newProduction: isNewConstruction,
        description,
        geo: { latitude, longitude },
      },
    };
  });
}
