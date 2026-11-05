import { municipalityName } from "../../lib/swedishPlaces.ts";

// Shared parsers for the agency mappers. Each turns a raw value from a site into
// something the listings table accepts, or null. Never undefined.

// What the listings table accepts per number column. SAME LIMITS as the check constraints on listings
// (supabase/schema.sql): change both together. bigint/smallint columns must also get whole numbers
const LIMITS = {
  price: (n: number) => Number.isInteger(n) && n >= 1 && n <= 1_000_000_000,
  rooms: (n: number) => n > 0 && n <= 100,
  monthly_fee: (n: number) => Number.isInteger(n) && n >= 1 && n <= 100_000,
  living_area: (n: number) => n > 0 && n <= 10_000,
  plot_area: (n: number) =>
    Number.isInteger(n) && n >= 0 && n <= 10_000_000,
  floor_level: (n: number) => Number.isInteger(n) && n >= -5 && n <= 100,
  build_year: (n: number) => Number.isInteger(n) && n >= 1000 && n <= 2100,
} satisfies Record<string, (n: number) => boolean>;

// The number if the listings table accepts it, otherwise null. One value the database rejects
// fails the whole batch upsert, so a site with broken data loses this value only. Logged, not flagged:
// one odd value is not worth an entry in scrape_issues
export function withinLimits(
  field: keyof typeof LIMITS,
  n: number | null,
): number | null {
  if (n === null || LIMITS[field](n)) return n;
  console.warn(`${field} ${n} is outside the limits, saving null`);
  return null;
}

// Sites may write numbers as strings, and coordinates with a decimal comma. Parse to number and replace , with .
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// A number above 0, otherwise null. Sites use "0" for "no value (yet)", e.g. no price or no rooms on a plot
export function toPositive(value: unknown): number | null {
  const n = toNumber(value);
  return n !== null && n > 0 ? n : null;
}

// "4 100 kr/månad" -> 4100. Thousands are separated with a (non-breaking) space
export function toFee(text: string | null): number | null {
  const digits = text?.match(/\d[\d\s ]*/)?.[0].replace(/\D/g, "");
  return digits ? toPositive(Number(digits)) : null;
}

// Trimmed text, or null if it is not a string or empty. Too long text becomes null,
// or is cut when truncate is set (a cut URL or address would be wrong, a cut description is fine)
export function toText(
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

// Like toText, but repeated whitespace (also non-breaking) becomes one space,
// so "Partille  centrum" and "Partille centrum" are the same area when matching. Max 100 characters
export function toPlaceName(value: unknown): string | null {
  return typeof value === "string"
    ? toText(value.replace(/\s+/g, " "), 100)
    : null;
}

// The municipality as spelled in the municipalities table ("göteborg" -> "Göteborg"), since matching compares
// it exactly with the user's search. An unknown name becomes null: it could never match anyway
export function toMunicipality(value: unknown): string | null {
  const text = toText(value);
  if (!text) return null;
  const name = municipalityName(text);
  if (!name) console.warn(`Unknown municipality "${text}", saving null`);
  return name;
}

// An https URL of at most maxLength characters, otherwise null
export function toHttpsUrl(value: unknown, maxLength: number): string | null {
  const text = toText(value, maxLength);
  if (text === null || text.startsWith("https://")) return text;
  console.warn(`Not an https URL "${text}", saving null`);
  return null;
}

// "692 m2" or "1 200 m2" -> 692 / 1200. Thousands are separated with a (non-breaking) space.
// Only square metres: anything else (e.g. hectares) becomes null rather than a wrong number
export function toArea(text: string | null): number | null {
  const digits = text
    ?.match(/^(\d[\d\s ]*)(?:,\d+)?\s*m/)?.[1]
    ?.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}
