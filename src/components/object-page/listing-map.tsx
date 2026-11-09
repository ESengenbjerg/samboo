// This file is needed for test experience in Expo Go

type ListingMapProps = {
  latitude: number | null;
  longitude: number | null;
};

// The map only exists on web, the Google Maps library needs a browser
export default function ListingMap(_props: ListingMapProps) {
  return null;
}
