import { ObjectCard } from "@/components/object-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Link } from "expo-router";
import { View } from "react-native";

export default function SearchScreen() {
  return (
    <View className="flex-1 p-8 bg-background space-y-8">
      <Text variant="h1">Filtrerad sökning</Text>
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

    <View className="space-y-4">
    

      <ObjectCard address={""} area={""} price={0} livingArea={0} rooms={0} imageUrl={""}        
      />

      </View>
    </View>
  );
}
