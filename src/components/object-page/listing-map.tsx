// This file is needed for test experience in Expo Go

import type { ListingCoordinates } from "@/types/listing";

// The map only exists on web, the Google Maps library needs a browser
export default function ListingMap(_props: ListingCoordinates) {
  return null;
}
