import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { cn } from "@/lib/utils";
import { formatPrice } from "@shared/format";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { LikeButton } from "./like-button";
import OnCardTag from "./tags/card-tag";
import { Icon } from "./ui/icon";

const fallbackImage = require("@/assets/images/no-image.jpg");

const objectCardVariants = cva("gap-3", {
  variants: {
    size: {
      default: "w-full",
      small: "w-[48%]",
    },
  },
  defaultVariants: { size: "default" },
});

const imageWrapperVariants = cva("w-full", {
  variants: {
    size: {
      default: "h-48",
      small: "h-28",
    },
  },
  defaultVariants: { size: "default" },
});

type ObjectCardProps = VariantProps<typeof objectCardVariants> & {
  address: string;
  area: string;
  municipality: string;
  price: number | null;
  livingArea: number | null;
  rooms: number | null;
  imageUrl: string;
  listingId: number;
  isRemoved: boolean;
  isNew?: boolean;
  isNewConstruction?: boolean;
  onPress?: () => void;
  className?: string;
};

export function ObjectCard({
  address,
  area,
  municipality,
  price,
  livingArea,
  rooms,
  imageUrl,
  listingId,
  isRemoved,
  isNew,
  isNewConstruction,
  onPress,
  size,
  className,
}: ObjectCardProps) {
  const isSmall = size === "small";

  // Image handling
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showFallback = !imageUrl || failedUrl === imageUrl;

  return (
    <View className={cn(objectCardVariants({ size }), className)}>
      <Card className="grow py-0 overflow-hidden">
        <View className="relative items-center justify-center">
          {isRemoved && (
            <View className="absolute z-10 items-center justify-center">
              <Text variant="large" className="text-primary drop-shadow-sm">
                Hittas inte
              </Text>
              <View className="flex-row items-center gap-1 px-4">
                <Text variant="small" className="text-center text-primary">
                  Mer info
                </Text>
                <Icon
                  as={ChevronRight}
                  className="text-secondary bg-primary rounded-full"
                />
              </View>
            </View>
          )}
          <View className={imageWrapperVariants({ size })}>
            <Image
              source={showFallback ? fallbackImage : { uri: imageUrl }}
              onError={() => setFailedUrl(imageUrl ?? null)}
              style={{
                width: "100%",
                height: "100%",
                filter: isRemoved
                  ? "grayscale(0.2) brightness(40%)"
                  : undefined,
              }}
              contentFit="cover"
            />
            <OnCardTag
              isNew={isNew}
              isNewConstruction={isSmall && isNew ? false : isNewConstruction}
            />
          </View>
        </View>

        {!isSmall ? (
          <>
            <CardHeader className="flex-row overflow-hidden justify-between">
              <View className="flex-1 gap-1">
                <CardTitle
                  numberOfLines={1}
                  className="max-w-[90%] leading-tight"
                >
                  {address}
                </CardTitle>
                <CardDescription numberOfLines={1} className="max-w-[90%]">
                  {[area, municipality].filter(Boolean).join(", ")}
                </CardDescription>
              </View>
            </CardHeader>

            <CardContent className="flex-row flex-wrap justify-between pb-4">
              {/* -- PRICE --- */}
              {!price ? (
                <Text variant="small">Pris saknas</Text>
              ) : (
                <Text variant="small">{formatPrice(price)}</Text>
              )}

              {/* -- LIVING AREA --- */}
              {!!livingArea && <Text variant="small">{livingArea} kvm</Text>}

              {/* -- ROOMS --- */}
              {!!rooms && <Text variant="small">{rooms} rum</Text>}
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="flex-1 px-3">
              <View>
                <CardTitle numberOfLines={1} className="leading-tight">
                  {address}
                </CardTitle>
                <CardDescription numberOfLines={1}>
                  {[area, municipality].filter(Boolean).join(", ")}
                </CardDescription>
              </View>
            </CardHeader>

            <CardContent className="px-3 pb-3 gap-1.5">
              <View className="flex-row flex-wrap justify-between">
                {/* -- ROOMS --- */}
                {!!rooms && <Text variant="small">{rooms} rum</Text>}

                {/* -- LIVING AREA --- */}
                {!!livingArea && <Text variant="small">{livingArea} kvm</Text>}
              </View>
              <View className="flex-row justify-between">
                {/* -- PRICE --- */}
                {!price ? (
                  <Text variant="small">Pris saknas</Text>
                ) : (
                  <Text variant="small">{formatPrice(price)}</Text>
                )}
              </View>
            </CardContent>
          </>
        )}
        <Pressable
          onPress={onPress}
          role="link"
          aria-label={`${address}, ${area}`}
          className="absolute inset-0 z-0"
        />
      </Card>

      <LikeButton
        listingId={listingId}
        size={20}
        className={
          isSmall ? "absolute right-1 bottom-2" : "absolute right-4 bottom-20"
        }
      />
    </View>
  );
}
