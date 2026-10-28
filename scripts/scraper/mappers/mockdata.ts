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
};

// // Number(null) is 0, so check for null/empty first
// function toNumber(value) {
//   if (value === null || value === undefined || value === "") return null;
//   const n = Number(value);
//   return Number.isFinite(n) ? n : null;
// }

// Only real numbers pass. Strings, null, undefined, NaN and Infinity become null
function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// A price has to be a real number above 0. Anything else means "no price (yet)" -> null
function toPrice(value: unknown): number | null {
  const n = toNumber(value);
  return n !== null && n > 0 ? n : null;
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
  price?: unknown;
  rooms?: unknown;
  geo?: { latitude?: unknown; longitude?: unknown };
};

export function mapListing(data: MockdataLdJson): MappedListing {
  return {
    property_type: mapPropertyType(data.category),
    municipality: data.municipality ?? null,
    area: data.district ?? data.addressLocality ?? null,
    price: toPrice(data.price),
    rooms: toNumber(data.rooms),
    latitude: toNumber(data.geo?.latitude),
    longitude: toNumber(data.geo?.longitude),
    // Mockdata has no such fields
    monthly_fee: null,
    living_area: null,
    is_new_construction: false,
    // NOTE! toNumber always returns an actuall number or null. So if value is missing it will be null
  };
}
