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

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Heart } from "lucide-react-native";
import { useState } from "react";

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
  price: number | null;
  livingArea: number | null;
  rooms: number | null;
  imageUrl: string;
  isSaved?: boolean;
  onPress?: () => void;
  onSavePress?: () => void;
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
  isSaved = false,
  onPress,
  onSavePress,
  size,
  className,
}: ObjectCardProps) {
  const isSmall = size === "small";

  // Image handling
  const [imageFailed, setImageFailed] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showFallback = !imageUrl || failedUrl === imageUrl;

  const saveButton = (
    <Pressable
      onPress={onSavePress}
      hitSlop={12}
      role="button"
      aria-label={isSaved ? "Ta bort från sparade" : "Spara objekt"}
      className="z-10"
    >
      <Icon
        as={Heart}
        className={cn(
          "size-5",
          isSaved ? "fill-destructive text-destructive" : "text-foreground",
        )}
      />
    </Pressable>
  );

  return (
    <View className={cn(objectCardVariants({ size }), className)}>
      <Card className="flex-1 py-0 overflow-hidden">
        <View className={imageWrapperVariants({ size })}>
          <Image
            source={showFallback ? fallbackImage : { uri: imageUrl }}
            onError={() => setImageFailed(true)}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>

        {!isSmall ? (
          <>
            <CardHeader className="flex-1 flex-row overflow-hidden justify-between">
              <View className="flex-1">
                <CardTitle>{address}</CardTitle>
                <CardDescription>{area}</CardDescription>
              </View>

              {saveButton}
            </CardHeader>

            <CardContent className="flex-row flex-wrap justify-between pb-4">
              {/* -- PRICE --- */}
              {!price ? (
                <Text variant="small">Pris saknas</Text>
              ) : (
                <Text variant="small">{price.toLocaleString("sv-SE")} kr</Text>
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
                <CardTitle>{address}</CardTitle>
                <CardDescription>{area}</CardDescription>
              </View>
            </CardHeader>

            <CardContent className="px-3 pb-3">
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
                  <Text variant="small">
                    {price.toLocaleString("sv-SE")} kr
                  </Text>
                )}

                {saveButton}
              </View>
            </CardContent>
          </>
        )}
        <Pressable
          onPress={onPress}
          role="link"
          aria-label={`${address}, ${area}`}
          className="absolute inset-0"
        />
      </Card>
    </View>
  );
}
