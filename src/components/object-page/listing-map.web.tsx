// Google map with one marker for the listing.
// Metro picks this file instead of listing-map.tsx on web (the .web.tsx extension).

import { Text } from "@/components/ui/text";
import { APIProvider, Map as GoogleMap } from "@vis.gl/react-google-maps";
import { View } from "react-native";

// Same props as listing-map.tsx
type ListingMapProps = {
  latitude: number | null;
  longitude: number | null;
};

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID;

// Set zoom level, aims to show neighbourhood around the listing
const zoom = 15;

// Create the map component
export default function ListingMap({ latitude, longitude }: ListingMapProps) {
  // Render nothing without coordinates
  if (latitude == null || longitude == null || !API_KEY || !MAP_ID) return null;

  const posision = { lat: latitude, lng: longitude };

  return (
    <View className="gap-2">
      <Text variant="h4">Läge</Text>
      <View className="h-60 w-full overflow-hidden rounded-sm">
        <APIProvider apiKey={API_KEY} language="sv" region="SE">
          <GoogleMap
            key={`${latitude}, ${longitude}`}
            mapId={MAP_ID}
            defaultCenter={posision}
            defaultZoom={zoom}
            // 1 finger scrolls the page
            // 2 fingers moves the map
            gestureHandling="cooperative"
            disableDefaultUI
            clickableIcons={false}
          />
        </APIProvider>
      </View>
    </View>
  );
}
