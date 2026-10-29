import { ObjectCard } from "@/components/object-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Listing } from "@/types/listing";
import { Link, router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import FormError from "./form-error";

type BasePath = "/saved/object/[id]" | "/search/object/[id]";

type ListingsProps = {
  title: string;
  listings: Listing[];
  path: BasePath;
  isLoading: boolean;
  error: string | null;
};

export default function ListingsFeed({
  title,
  listings,
  path,
  isLoading,
  error,
}: ListingsProps) {
  const [view, setView] = useState<"column" | "grid">("column");

  function goToObject(listingId: number, path: BasePath) {
    router.push({
      pathname: path,
      params: { id: String(listingId) },
    });
  }

  return (
    <View className="flex-1 px-6 bg-background gap-8 ">
      <View className="flex-row justify-between">
        <Text variant="h1">{title}</Text>
        {/* TODO: Replace with correct component */}
        <Button
          onPress={() =>
            view === "column" ? setView("grid") : setView("column")
          }
        >
          <Text>Toggle</Text>
        </Button>
      </View>
      <View className="flex-row justify-between items-end">
        <View className="gap-4">
          <Label>Sortera</Label>
          <Select>
            <SelectTrigger className="bg-white min-w-32">
              <SelectValue placeholder="Nyast först" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem label="Nyast" value="new" />
              <SelectItem label="Äldst" value="oldest" />
              <SelectItem label="Lägst pris" value="price-low" />
              <SelectItem label="Högst pris" value="price-high" />
            </SelectContent>
          </Select>
        </View>
        <Button variant="link" className="pb-0">
          <Link href="/(tabs)/update-filter">
            <Text>Uppdatera bevakning</Text>
          </Link>
        </Button>
      </View>

      {isLoading && <Text>Laddar...</Text>}
      {error && <FormError>{error}</FormError>}

      {!isLoading && !error && listings.length === 0 && (
        <Text>Inga objekt hittades.</Text>
      )}

      {/* Present properties based in column or grid based on user choice */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          className={`${view === "grid" ? "flex-row gap-2 mb-4 flex-wrap" : "gap-4 mb-4"}`}
        >
          {/* Map through properties */}
          {listings.map((listing) => (
            <ObjectCard
              key={listing.id}
              address={listing.ld_json.streetAddress ?? ""}
              area={listing.area ?? ""}
              municipality={listing.municipality ?? ""}
              price={listing.price ?? 0}
              livingArea={listing.living_area ?? 0}
              rooms={listing.rooms ?? 0}
              imageUrl={listing.ld_json.image ?? ""}
              onPress={() => goToObject(listing.id, path)}
              size={view === "grid" ? "small" : "default"}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
