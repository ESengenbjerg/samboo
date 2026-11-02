// Google Maps search for an address. Empty parts are skipped.
// The return type tells Expo Router's typed <Link href> that this is an external URL
export function googleMapsUrl(
  ...parts: (string | null | undefined)[]
): `https://${string}` {
  const query = parts.filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
