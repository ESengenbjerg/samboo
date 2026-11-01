import type { MappedListing, PropertyType } from "../../lib/types.ts";

// Maps mockdata's ld+json to the normalized columns on the listings table.
// Missing values become null, never undefined.

// Agency term -> our own property_type
const PROPERTY_TYPES: Record<string, PropertyType> = {
  villa: "villa",
  radhus: "radhus",
  parhus: "radhus",
  kedjehus: "radhus",
  tomt: "tomt",
  lagenhet: "lagenhet",
  lägenhet: "lagenhet",
  fritidshus: "fritidshus",
};

// Only real numbers pass. Strings, null, undefined, NaN and Infinity become null
function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// A price has to be a real number above 0. Anything else means "no price (yet)" -> null
function toPrice(value: unknown): number | null {
  const n = toNumber(value);
  return n !== null && n > 0 ? n : null;
}

// Trimmed text, or null if it is not a string or empty. Too long text becomes null, or is cut when truncate is set (a cut URL or address would be wrong, a cut description is fine)
function toText(
  value: unknown,
  maxLength: number,
  truncate = false,
): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text === "") return null;
  if (text.length <= maxLength) return text;
  return truncate ? text.slice(0, maxLength) : null;
}

// For smallint/bigint columns: only whole numbers within [min, max] pass, since one value the database rejects fails the whole batch upsert
function toInteger(value: unknown, min: number, max: number): number | null {
  const n = toNumber(value);
  return n !== null && Number.isInteger(n) && n >= min && n <= max ? n : null;
}

function mapPropertyType(category: unknown): PropertyType | null {
  if (!category) return null;

  const mapped = PROPERTY_TYPES[String(category).trim().toLowerCase()];
  if (!mapped) {
    console.warn(`Unknown property type "${category}", saving as "other"`);
    return "other";
  }
  return mapped;
}

// The parts of mockdata's ld+json we read
export type MockdataLdJson = {
  path: string;
  category?: string | null;
  municipality?: string | null;
  district?: string | null;
  addressLocality?: string | null;
  streetAddress?: unknown;
  image?: unknown;
  description?: unknown;
  price?: unknown;
  rooms?: unknown;
  floorLevel?: unknown;
  plotArea?: unknown;
  newProduction?: unknown;
  monthlyFee?: unknown;
  livingArea?: unknown;
  buildYear: number | null;
  geo?: { latitude?: unknown; longitude?: unknown };
};

export function mapListing(data: MockdataLdJson): MappedListing {
  return {
    property_type: mapPropertyType(data.category),
    municipality: data.municipality ?? null,
    area: data.district ?? data.addressLocality ?? null,
    address: toText(data.streetAddress, 300),
    price: toPrice(data.price),
    rooms: toNumber(data.rooms),
    floor_level: toInteger(data.floorLevel, -5, 100),
    plot_area: toInteger(data.plotArea, 0, Number.MAX_SAFE_INTEGER),
    image_url: toText(data.image, 500),
    description: toText(data.description, 5000, true),
    latitude: toNumber(data.geo?.latitude),
    longitude: toNumber(data.geo?.longitude),
    monthly_fee: toNumber(data.monthlyFee),
    living_area: toNumber(data.livingArea),
    build_year: toNumber(data.buildYear),
    is_new_construction: data.newProduction === true,
    // NOTE! toNumber always returns an actuall number or null. So if value is missing it will be null
  };
}
