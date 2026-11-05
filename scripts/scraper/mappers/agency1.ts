import type { MappedListing, PropertyType } from "../../lib/types.ts";
import {
  toArea,
  toFee,
  toHttpsUrl,
  toMunicipality,
  toNumber,
  toPlaceName,
  toPositive,
  toText,
  withinLimits,
} from "./parse.ts";

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

// agency1 writes the street address as "Storgatan 1, Centrum". The area is saved in its own column,
// so cut the last part, but only when it is the area. "Storgatan 1, lgh 1101" keeps its last part
function mapAddress(streetAddress: unknown, region: unknown): string | null {
  const text = toText(streetAddress);
  if (!text) return null;

  const lastComma = text.lastIndexOf(",");
  const lastPart = text.slice(lastComma + 1).trim().toLowerCase();
  const regionText = toText(region)?.toLowerCase();
  const cut = lastComma !== -1 && !!regionText && lastPart === regionText;

  return toText(cut ? text.slice(0, lastComma) : text, 300);
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
      yearBuilt?: unknown;
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
    municipality: toMunicipality(home?.address?.addressLocality),
    address: mapAddress(
      home?.address?.streetAddress,
      home?.address?.addressRegion,
    ),
    area: toPlaceName(home?.address?.addressRegion),
    price: withinLimits("price", toPositive(data.product?.offers?.price)),
    rooms: withinLimits("rooms", toPositive(home?.numberOfRooms)),
    image_url: toHttpsUrl(data.product?.image?.[0], 500),
    description: toText(data.product?.description, 5000, true),
    floor_level: withinLimits("floor_level", toNumber(home?.floorLevel)),
    plot_area: withinLimits("plot_area", toArea(facts.plotArea)),
    latitude: toNumber(home?.geo?.latitude),
    longitude: toNumber(home?.geo?.longitude),
    monthly_fee: withinLimits("monthly_fee", toFee(facts.monthlyFee)),
    living_area: withinLimits("living_area", toPositive(home?.floorSize?.value)),
    build_year: withinLimits("build_year", toNumber(home?.yearBuilt)),
    is_new_construction: facts.isNewConstruction,
  };
}
