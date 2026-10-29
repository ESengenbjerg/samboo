import ObjectInfo from "@/components/object-page/object-info";
import { OBJECT_INFO_OPTIONS } from "@/components/object-page/object-info-config";
import ScheduleShowingSection from "@/components/object-page/schedule-showing-section";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { Listing } from "@/types/listing";
import { formatPrice } from "@/utils/format-price";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Linking, ScrollView, View } from "react-native";

type ObjectPageProps = {
  listing: Listing | null;
  isLoading: boolean;
};

export default function ObjectPageScreen({
  listing,
  isLoading,
}: ObjectPageProps) {
  if (isLoading)
    return (
      <View className="flex-1 px-8 py-6 gap-6 bg-background">
        <Text>Laddar...</Text>
      </View>
    );

  if (!listing)
    return (
      <View className="flex-1 px-8 py-6 gap-6 bg-background justify-center items-center ">
        <Text>Kunde inte hitta objekt.</Text>
        <Button className="w-36" onPress={() => router.back()}>
          <Text>Tillbaka</Text>
        </Button>
      </View>
    );

  //   const listing = listings;

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
              : require("@/assets/images/no-image.jpg")
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
              <Text variant="bold">{formatPrice(listing.price)}</Text>
            )}
          </View>
          <Separator />
          {/* --- OBJECT INFO --- */}
          <View className="gap-6">
            <Text variant="h4">Om bostaden</Text>
            <View className="gap-2">
              {OBJECT_INFO_OPTIONS.map((o) => (
                <ObjectInfo key={o} type={o} value={listing[o]} />
              ))}
            </View>
            <Button
              onPress={() => Linking.openURL(listing.url)}
              className="w-52 mt-4"
            >
              <Text>Läs mer hos mäklaren</Text>
            </Button>
          </View>
          <Separator />
          {/* --- SCHEDULE SHOWING --- */}
          <ScheduleShowingSection listingId={listing.id} />{" "}
        </View>
      </ScrollView>
    </View>
  );
}
