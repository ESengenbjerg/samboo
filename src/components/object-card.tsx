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

const objectCardVariants = cva("gap-3 py-0", {
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
  price: number;
  livingArea: number;
  rooms: number;
  imageUrl: string;
  isSaved?: boolean;
  onPress?: () => void;
  onSavePress?: () => void;
  className?: string;
  imageCount?: number;
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
  imageCount = 17,
}: ObjectCardProps) {
  const isSmall = size === "small";
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackImage =
    "https://images.unsplash.com/photo-1631679706909-1844bbd07221?q=80&w=1092&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D";

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
    <>
      <View className={cn(objectCardVariants({ size }), className)}>
        <Card className="flex-1 py-0 overflow-hidden">
          <View className={imageWrapperVariants({ size })}>
            <Image
              source={{
                uri: imageFailed || !imageUrl ? fallbackImage : imageUrl,
              }}
              onError={() => setImageFailed(true)}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
            {imageCount && (
              <View className="absolute bottom-2 right-2 rounded bg-background p-1">
                <Text variant="xsmall">1/{imageCount}</Text>
              </View>
            )}
          </View>

          {!isSmall ? (
            <>
              <CardHeader className="flex-1 flex-row overflow-hidden justify-between">
                <View>
                  <CardTitle>{address}</CardTitle>
                  <CardDescription>
                    {[area, municipality].filter(Boolean).join(", ")}
                  </CardDescription>
                </View>

                {saveButton}
              </CardHeader>

              <CardContent className="flex-row flex-wrap justify-between pb-4">
                <Text variant="small">{price.toLocaleString("sv-SE")}kr</Text>
                <Text variant="small">{livingArea} kvm</Text>
                <Text variant="small">{rooms} rum</Text>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="flex-1 px-3">
                <View>
                  <CardTitle>{address}</CardTitle>
                  <CardDescription>
                    {[area, municipality].filter(Boolean).join(", ")}
                  </CardDescription>
                </View>
              </CardHeader>

              <CardContent className="px-3 pb-3">
                <View className="flex-row flex-wrap justify-between">
                  <Text variant="small">{livingArea} kvm</Text>
                  <Text variant="small">{rooms} rum</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text variant="small">{price.toLocaleString("sv-SE")}kr</Text>
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
    </>
  );
}
