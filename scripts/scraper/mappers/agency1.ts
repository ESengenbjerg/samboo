import type { MappedListing, PropertyType } from "../../lib/types.ts";

// Maps agency1's ld+json to the normalized columns on the listings table.
// Missing values become null, never undefined.

// Match first word of the type ("Radhus, 2-plans radhus" or "Villa till salu") -> our own property_type
const PROPERTY_TYPES: Record<string, PropertyType> = {
  villa: "villa",
  radhus: "radhus",
  parhus: "radhus",
  kedjehus: "radhus",
  tomt: "tomt",
  bostadsrätt: "lagenhet",
  bostadsrättslägenhet: "lagenhet",
  lägenhet: "lagenhet",
};

// The site writes every number as a string, and coordinates with a decimal comma. Parse to number and replace , with .
function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// A price has to be a real number above 0. The site uses "0" for "no price (yet)"
function toPrice(value: unknown): number | null {
  const n = toNumber(value);
  return n !== null && n > 0 ? n : null;
}

// "4 100 kr/månad" -> 4100. The site separates thousands with a (non-breaking) space
function toFee(text: string | null): number | null {
  const digits = text?.match(/\d[\d\s\u00a0]*/)?.[0].replace(/\D/g, "");
  return digits ? toPrice(Number(digits)) : null;
}

function toText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

// Find property type by parsing
function mapPropertyType(type: unknown): PropertyType | null {
  const text = toText(type);
  if (!text) return null;

  const key = text.split(/[ ,]/)[0]?.toLowerCase() ?? "";
  const mapped = PROPERTY_TYPES[key];
  if (!mapped) {
    console.warn(`Unknown property type "${text}", saving as "other"`);
    return "other";
  }
  return mapped;
}

// The parts of agency1's ld+json (the RealEstateListing object) we read
export type Agency1LdJson = {
  category?: string | null;
  mainEntityOfPage?: string;
  product?: {
    mpn?: string;
    offers?: { price?: unknown };
    isRelatedTo?: {
      address?: { addressLocality?: string; addressRegion?: string };
      numberOfRooms?: unknown;
      floorSize?: { value?: unknown };
      geo?: { latitude?: unknown; longitude?: unknown };
    };
  };
};

// What is not in the ld+json but read from the page or the search card
export type PageFacts = {
  // The "Typ:" line ("Radhus, 2-plans radhus"). ld+json calls terraced houses "Villa", so this goes first
  listingType: string | null;
  // The "Månadsavgift:" line ("4 100 kr"), only on apartments
  monthlyFee: string | null;
  // The new-build label on the search card
  isNewConstruction: boolean;
};

export function mapListing(
  data: Agency1LdJson,
  facts: PageFacts,
): MappedListing {
  const home = data.product?.isRelatedTo;
  return {
    property_type: mapPropertyType(facts.listingType ?? data.category),
    municipality: toText(home?.address?.addressLocality),
    area: toText(home?.address?.addressRegion),
    price: toPrice(data.product?.offers?.price),
    rooms: toNumber(home?.numberOfRooms),
    latitude: toNumber(home?.geo?.latitude),
    longitude: toNumber(home?.geo?.longitude),
    monthly_fee: toFee(facts.monthlyFee),
    living_area: toPrice(home?.floorSize?.value),
    is_new_construction: facts.isNewConstruction,
  };
}
