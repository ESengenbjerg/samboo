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
  fritidshus: "fritidshus",
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

// Trimmed text, or null if it is not a string or empty. Too long text becomes null,
// or is cut when truncate is set (a cut URL or address would be wrong, a cut description is fine)
function toText(
  value: unknown,
  maxLength = Infinity,
  truncate = false,
): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text === "") return null;
  if (text.length <= maxLength) return text;
  return truncate ? text.slice(0, maxLength) : null;
}

// For smallint/bigint columns: only whole numbers within [min, max] pass,
// since one value the database rejects fails the whole batch upsert
function toInteger(value: unknown, min: number, max: number): number | null {
  const n = toNumber(value);
  return n !== null && Number.isInteger(n) && n >= min && n <= max ? n : null;
}

// "692 m2" or "1 200 m2" -> 692 / 1200. The site separates thousands with a (non-breaking) space.
// Only square metres: anything else (e.g. hectares) becomes null rather than a wrong number
function toArea(text: string | null): number | null {
  const digits = text
    ?.match(/^(\d[\d\s\u00a0]*)(?:,\d+)?\s*m/)?.[1]
    ?.replace(/\D/g, "");
  return digits ? toInteger(Number(digits), 0, Number.MAX_SAFE_INTEGER) : null;
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
    image?: unknown[];
    description?: unknown;
    offers?: { price?: unknown };
    isRelatedTo?: {
      address?: {
        streetAddress?: string;
        addressLocality?: string;
        addressRegion?: string;
      };
      numberOfRooms?: unknown;
      floorLevel?: unknown;
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
  // The "Tomtarea:" line ("692 m2"), only on houses
  plotArea: string | null;
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
    address: toText(home?.address?.streetAddress, 300),
    area: toText(home?.address?.addressRegion),
    price: toPrice(data.product?.offers?.price),
    rooms: toNumber(home?.numberOfRooms),
    image_url: toText(data.product?.image?.[0], 500),
    description: toText(data.product?.description, 5000, true),
    floor_level: toInteger(home?.floorLevel, -5, 100),
    plot_area: toArea(facts.plotArea),
    latitude: toNumber(home?.geo?.latitude),
    longitude: toNumber(home?.geo?.longitude),
    monthly_fee: toFee(facts.monthlyFee),
    living_area: toPrice(home?.floorSize?.value),
    is_new_construction: facts.isNewConstruction,
  };
}
