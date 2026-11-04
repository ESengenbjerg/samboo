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
import { useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { LikeButton } from "../like-button";

type ObjectPageProps = {
  listing: Listing | null;
  isLoading: boolean;
};

const fallbackImage = require("@/assets/images/no-image.jpg");

// Shows the fallback image when the listing has no image, or the image fails to load
function ListingImage({ imageUrl }: { imageUrl: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showFallback = !imageUrl || failedUrl === imageUrl;

  return (
    <Image
      source={showFallback ? fallbackImage : { uri: imageUrl }}
      onError={() => setFailedUrl(imageUrl)}
      style={{ width: "100%", height: 320 }}
      contentFit="cover"
    />
  );
}

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
        <ListingImage imageUrl={listing.image_url} />
        <View className="px-8 py-6 gap-6">
          {/* --- ADDRESS AND AREA --- */}
          <View className="gap-4">
            <View>
              <View className="flex-row justify-between items-center">
                <Text variant="h1">
                  {listing.address ?? "Adress saknas"}
                </Text>
                <LikeButton listingId={listing.id} size={24} />
              </View>
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
          <ScheduleShowingSection listingId={listing.id} />
        </View>
      </ScrollView>
    </View>
  );
}
