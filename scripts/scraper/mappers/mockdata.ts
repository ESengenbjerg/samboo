import type { MappedListing, PropertyType } from "../../lib/types.ts";
import {
  toHttpsUrl,
  toMunicipality,
  toNumber,
  toPlaceName,
  toPositive,
  toText,
  withinLimits,
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

function mapPropertyType(category: unknown): PropertyType {
  const text = toText(category);
  if (!text) {
    console.warn(`No property type, saving as "other"`);
    return "other";
  }

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
    municipality: toMunicipality(data.municipality),
    area: toPlaceName(data.district ?? data.addressLocality),
    address: toText(data.streetAddress, 300),
    price: withinLimits("price", toPositive(data.price)),
    rooms: withinLimits("rooms", toPositive(data.rooms)),
    floor_level: withinLimits("floor_level", toNumber(data.floorLevel)),
    plot_area: withinLimits("plot_area", toNumber(data.plotArea)),
    image_url: toHttpsUrl(data.image, 500),
    description: toText(data.description, 5000, true),
    latitude: withinLimits("latitude", toNumber(data.geo?.latitude)),
    longitude: withinLimits("longitude", toNumber(data.geo?.longitude)),
    monthly_fee: withinLimits("monthly_fee", toPositive(data.monthlyFee)),
    living_area: withinLimits("living_area", toPositive(data.livingArea)),
    build_year: withinLimits("build_year", toNumber(data.buildYear)),
    is_new_construction: data.newProduction === true,
  };
}
