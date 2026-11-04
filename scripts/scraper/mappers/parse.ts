// Shared parsers for the agency mappers. Each turns a raw value from a site into
// something the listings table accepts, or null. Never undefined.

// Sites may write numbers as strings, and coordinates with a decimal comma. Parse to number and replace , with .
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// A price has to be a real number above 0. Sites use "0" for "no price (yet)"
export function toPrice(value: unknown): number | null {
  const n = toNumber(value);
  return n !== null && n > 0 ? n : null;
}

// "4 100 kr/månad" -> 4100. Thousands are separated with a (non-breaking) space
export function toFee(text: string | null): number | null {
  const digits = text?.match(/\d[\d\s ]*/)?.[0].replace(/\D/g, "");
  return digits ? toPrice(Number(digits)) : null;
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
// so "Partille  centrum" and "Partille centrum" are the same area when matching
export function toPlaceName(value: unknown): string | null {
  return typeof value === "string"
    ? toText(value.replace(/\s+/g, " "))
    : null;
}

// For smallint/bigint columns: only whole numbers within [min, max] pass,
// since one value the database rejects fails the whole batch upsert
export function toInteger(
  value: unknown,
  min: number,
  max: number,
): number | null {
  const n = toNumber(value);
  return n !== null && Number.isInteger(n) && n >= min && n <= max ? n : null;
}

// "692 m2" or "1 200 m2" -> 692 / 1200. Thousands are separated with a (non-breaking) space.
// Only square metres: anything else (e.g. hectares) becomes null rather than a wrong number
export function toArea(text: string | null): number | null {
  const digits = text
    ?.match(/^(\d[\d\s ]*)(?:,\d+)?\s*m/)?.[1]
    ?.replace(/\D/g, "");
  return digits ? toInteger(Number(digits), 0, Number.MAX_SAFE_INTEGER) : null;
}
