import ObjectInfo from "@/components/object-page/object-info";
import { OBJECT_INFO_OPTIONS } from "@/components/object-page/object-info-config";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useListing } from "@/hooks/useListing";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

export default function SearchObjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userListing, isLoading } = useListing(id);

  if (isLoading)
    return (
      <View className="flex-1 px-8 py-6 gap-6 bg-background">
        <Text>Laddar...</Text>
      </View>
    );

  if (!userListing)
    return (
      <View className="flex-1 px-8 py-6 gap-6 bg-background">
        <Text>Kunde inte hitta objekt.</Text>
      </View>
    );

  const listing = userListing.listings;

  return (
    <View className="flex-1 bg-background">
      <Button
        className="justify-start"
        variant="link"
        onPress={() => router.back()}
      >
        <Text>Tillbaka</Text>
      </Button>
      <ScrollView className="flex-1">
        {/* --- IMAGE --- */}
        <Image
          source={
            listing.ld_json.image
              ? { uri: listing.ld_json.image }
              : require("@/assets/images/img.jpg")
          }
          style={{ width: "100%", height: 320 }}
          contentFit="cover"
        />
        <View className="px-8 py-6 gap-6">
          {/* --- ADDRESS AND AREA --- */}
          <View className="gap-4">
            <View>
              <Text variant="h1">
                {listing.ld_json.streetAddress ?? "Adress saknas"}
              </Text>
              <Text>
                {[listing.area, listing.municipality]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>

            {/* --- PRICE --- */}
            {listing.price != null && (
              <Text variant="bold">
                {listing.price.toLocaleString("sv-SE")} kr
              </Text>
            )}
          </View>

          {/* --- OBJECT INFO --- */}
          <View className="gap-2">
            <Text variant="h4">Om bostaden</Text>
            {OBJECT_INFO_OPTIONS.map((o) => (
              <ObjectInfo key={o} type={o} value={listing[o]} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
