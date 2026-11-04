import type { MappedListing, PropertyType } from "../../lib/types.ts";
import {
  toInteger,
  toNumber,
  toPlaceName,
  toPrice,
  toText,
} from "./parse.ts";

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

function mapPropertyType(category: unknown): PropertyType | null {
  const text = toText(category);
  if (!text) return null;

  const mapped = PROPERTY_TYPES[text.toLowerCase()];
  if (!mapped) {
    console.warn(`Unknown property type "${text}", saving as "other"`);
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
    municipality: toText(data.municipality),
    area: toPlaceName(data.district ?? data.addressLocality),
    address: toText(data.streetAddress, 300),
    price: toPrice(data.price),
    rooms: toNumber(data.rooms),
    floor_level: toInteger(data.floorLevel, -5, 100),
    plot_area: toInteger(data.plotArea, 0, Number.MAX_SAFE_INTEGER),
    image_url: toText(data.image, 500),
    description: toText(data.description, 5000, true),
    latitude: toNumber(data.geo?.latitude),
    longitude: toNumber(data.geo?.longitude),
    monthly_fee: toPrice(data.monthlyFee),
    living_area: toPrice(data.livingArea),
    build_year: toInteger(data.buildYear, 1000, 2100),
    is_new_construction: data.newProduction === true,
  };
}
