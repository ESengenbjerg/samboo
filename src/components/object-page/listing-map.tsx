// Native map (iOS/Android, Expo Go) with one marker for the listing.
// On web, Metro picks listing-map.web.tsx instead.
// iOS shows Apple Maps, Android shows Google Maps. No API key is needed in Expo Go.

import { Text } from "@/components/ui/text";
import type { ListingCoordinates } from "@/types/listing";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";

// Size of the visible area in degrees, roughly zoom 15 on web (neighbourhood)
const delta = 0.01;

export default function ListingMap({
  latitude,
  longitude,
}: ListingCoordinates) {
  // Render nothing without coordinates
  if (latitude == null || longitude == null) return null;

  const position = { latitude, longitude };

  return (
    <View className="gap-2">
      <Text variant="h4">Läge</Text>
      <View className="h-72 w-full overflow-hidden rounded-sm">
        <MapView
          key={`${latitude}, ${longitude}`}
          style={{ flex: 1 }}
          initialRegion={{
            ...position,
            latitudeDelta: delta,
            longitudeDelta: delta,
          }}
          // One finger scrolls the page, not the map
          // Pinch (2 fingers) zooms the map
          scrollEnabled={false}
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Marker coordinate={position} />
        </MapView>
      </View>
    </View>
  );
}
