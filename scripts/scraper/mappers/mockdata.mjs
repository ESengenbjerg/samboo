// Maps mockdata's ld+json to the normalized columns on the listings table.
// Missing values become null, never undefined.

// Agency term -> our own property_type
const PROPERTY_TYPES = {
  villa: "villa",
  radhus: "radhus",
  parhus: "radhus",
  kedjehus: "radhus",
  tomt: "tomt",
};

// Number(null) is 0, so check for null/empty first
function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapPropertyType(category) {
  if (!category) return null;

  const mapped = PROPERTY_TYPES[String(category).trim().toLowerCase()];
  if (!mapped) {
    console.warn(`Unknown property type "${category}", saving as "other"`);
    return "other";
  }
  return mapped;
}

export function mapListing(data) {
  return {
    property_type: mapPropertyType(data.category),
    municipality: data.municipality ?? null,
    area: data.district ?? data.addressLocality ?? null,
    price: toNumber(data.price),
    rooms: toNumber(data.rooms),
    latitude: toNumber(data.geo?.latitude),
    longitude: toNumber(data.geo?.longitude),
  };
}
