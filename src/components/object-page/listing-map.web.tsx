// Google map with one marker for the listing.
// Metro picks this file instead of listing-map.tsx on web (the .web.tsx extension).

import { Text } from "@/components/ui/text";
import { View } from "react-native";

// Same props as listing-map.tsx
type ListingMapProps = {
  latitude: number | null;
  longitude: number | null;
};

// Create the map component
export default function ListingMap({ latitude, longitude }: ListingMapProps) {
  // Render nothing without coordinates
  if (latitude == null || longitude == null) return null;

  return (
    <View className="gap-2">
      <Text variant="h4">Läge</Text>
      <View className="h-60 w-full overflow-hidden rounded-sm" />
    </View>
  );
}
