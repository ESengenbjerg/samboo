import ListingMap from "@/components/object-page/listing-map";
import ObjectInfo from "@/components/object-page/object-info";
import { OBJECT_INFO_OPTIONS } from "@/components/object-page/object-info-config";
import ScheduleShowingSection from "@/components/object-page/schedule-showing-section";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useMarkListingSeen } from "@/hooks/listings/useMarkListingSeen";
import { useBackToTop } from "@/hooks/ui/useBackToTop";
import { useTabBarInset } from "@/hooks/ui/useTabBarInset";
import { Listing } from "@/types/listing";
import handleBack from "@/utils/handle-back";
import { isListingRemoved } from "@/utils/is-listing-removed";
import { formatPrice } from "@shared/format";
import { Image } from "expo-image";
import { useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import BackToTopButton from "../back-to-top-button";
import { LikeButton } from "../like-button";
import { Spinner } from "../ui/spinner";
import ListingTagsSection from "./listing-tags-section";
import ObjectDescription from "./object-description";
import RemovedListingNotice from "./removed-listing-notice";

type ObjectPageProps = {
  listing: Listing | null;
  isLoading: boolean;
};

const fallbackImage = require("@/assets/images/no-image.jpg");

// Shows the fallback image when the listing has no image, or the image fails to load
function ListingImage({
  imageUrl,
  alt,
}: {
  imageUrl: string | null;
  alt: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showFallback = !imageUrl || failedUrl === imageUrl;

  return (
    <Image
      source={showFallback ? fallbackImage : { uri: imageUrl }}
      alt={showFallback ? "Bild saknas" : alt}
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
  // Mark the listing as seen every time the page opens, also a group member's listing outside my search
  useMarkListingSeen(listing?.id);

  const { scrollRef, showBackToTop, handleScroll, scrollToTop } =
    useBackToTop();
  const tabBarInset = useTabBarInset();

  if (isLoading)
    return (
      <View className="flex-1 px-8 py-6 gap-6 bg-background">
        <Spinner size="large" />
      </View>
    );

  if (!listing)
    return (
      <View className="flex-1 px-8 py-6 gap-6 bg-background justify-center items-center ">
        <Text>Kunde inte hitta objekt.</Text>
        <Button className="w-36" onPress={handleBack}>
          <Text>Tillbaka</Text>
        </Button>
      </View>
    );

  return (
    <View className="flex-1 bg-background">
      <Button
        className="justify-start pl-6"
        variant="link"
        onPress={handleBack}
      >
        <Text>Tillbaka</Text>
      </Button>
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: tabBarInset + 16 }}
      >
        {/* --- IMAGE --- */}
        <ListingImage
          imageUrl={listing.image_url}
          alt={`Bild på ${listing.address}`}
        />
        <View className="px-6 py-6 gap-6">
          {/* --- ADDRESS AND AREA --- */}
          <View className="gap-4">
            <View>
              <View className="flex-row justify-between gap-2">
                <Text variant="h1" className="flex-1 shrink min-w-0">
                  {listing.address ?? "Adress saknas"}
                </Text>
                <View className="shrink-0">
                  <LikeButton
                    listingId={listing.id}
                    address={listing.address ?? undefined}
                    size={24}
                  />
                </View>
              </View>
              <Text>
                {[listing.area, listing.municipality]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>

            {/* --- PRICE --- */}
            {listing.price != null ? (
              <Text variant="bold">{formatPrice(listing.price)}</Text>
            ) : (
              <Text variant="bold">Pris saknas</Text>
            )}
          </View>
          <Separator />

          {/* --- REMOVED OBJECTS --- */}
          {isListingRemoved(listing) && (
            <RemovedListingNotice url={listing.url} />
          )}

          {/* --- TAGS --- */}
          <ListingTagsSection listing={listing} />

          {/* --- OBJECT INFO --- */}
          <View className="gap-6">
            <Text variant="h4">Om bostaden</Text>
            <View className="gap-2">
              {OBJECT_INFO_OPTIONS.map((o) => (
                <ObjectInfo key={o} type={o} value={listing[o]} />
              ))}
            </View>
            <ObjectDescription description={listing.description} />
            <Button
              onPress={() => Linking.openURL(listing.url)}
              className="w-52 mt-4"
            >
              <Text>Läs mer hos mäklaren</Text>
            </Button>
          </View>

          {/* --- MAP --- */}
          <ListingMap
            latitude={listing.latitude}
            longitude={listing.longitude}
          />

          {/* --- SCHEDULE SHOWING --- */}
          <ScheduleShowingSection listingId={listing.id} />
        </View>
      </ScrollView>
      {showBackToTop && <BackToTopButton onPress={scrollToTop} />}
    </View>
  );
}
