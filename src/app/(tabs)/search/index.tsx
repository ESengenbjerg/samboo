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
import { Link, router } from "expo-router";
import { supabase } from "@/utils/supabase";
import { Listing } from "@/types/listing";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

export default function SearchScreen() {
  const [loading, setLoading] = useState(true);
  
  const [listings, setListings] = useState<Listing[]>([]);

  const [view, setView] = useState<"column" | "grid">("column");

  // Get data from database on first run
  // TODO: Remove policy from listings table to give anon permission to read
  useEffect(() => {
    supabase
      .from("listings")
      .select("*")
      .is("removed_at", null)
      .order("last_seen_at", { ascending: false })
      .overrideTypes<Listing[]>()
      .then(({ data, error }) => {
        if (error) console.error("Failed to load listings: ", error);
        else setListings(data);
        setLoading(false);
      });
  }, []);


  return (
    
      <View className="flex-1 px-8 bg-background space-y-8">
        <View className="flex-row justify-between">
          <Text variant="h1">Filtrerad sökning</Text>
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
          <View className="space-y-4">
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

        {loading && <Text>Laddar...</Text>}
        {!loading && listings.length === 0 && <Text>Inga objekt hittades</Text>}

        {/* Present properties based in column or grid based on user choice */}
        <ScrollView>
        <View
          className={`${view === "grid" ? "flex-row gap-2 flex-wrap" : "space-y-4"}`}
        >
          {/* Map through properties */}
          {listings.map((listing) => (
            <ObjectCard
              key={`${listing.agency}-${listing.external_id}`}
              address={listing.ld_json.streetAddress ?? ""}
              area={listing.area ?? ""}
              price={listing.price ?? 0}
              livingArea={listing.ld_json.livingArea ?? 0}
              rooms={listing.rooms ?? 0}
              imageUrl={listing.ld_json.image ?? ""}
              onPress={() => router.push("/(tabs)/search/object/[id]")}
              size={view === "grid" ? "small" : "default"}
            />
          ))}
        </View>
    </ScrollView>
      </View>
  );
}
