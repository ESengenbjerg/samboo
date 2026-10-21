import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LIVING_AREA_OPTIONS,
  MONTHLY_FEE_OPTIONS,
  ROOM_OPTIONS,
} from "@/constants/filter-options";
import { SelectOption } from "@/types/select-option";
import { supabase } from "@/utils/supabase";
import { useEffect, useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import FilterSelect from "./filter-select";
import { capitalize } from "@/utils/capitalize-string";

export default function CreateFilterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [existingPropertyTypes, setExistingPropertyTypes] = useState<string[]>(
    [],
  );

  // Filter alternatives
  const [area, setArea] = useState("");
  const [propertyType, setPropertyType] = useState<string[]>([]);
  const [rooms, setRooms] = useState<SelectOption>();
  const [monthlyFee, setMonthlyFee] = useState<SelectOption>();
  const [livingArea, setLivingArea] = useState<SelectOption>();
  const [showNewProduction, setShowNewProduction] = useState(true);
  const [informationInterval, setInformationInterval] = useState<
    "day" | "week"
  >("day");

  useEffect(() => {
    supabase
      .from("listings")
      .select("property_type")
      .then(({ data, error }) => {
        if (error) {
          console.log("Failed to load propertyTypes");
        } else {
          const types = data.map((row) => row.property_type).filter(Boolean);
          setExistingPropertyTypes([...new Set(types)]);
        }
      });
  }, []);

  return (
    <View className="flex-1 justify-center w-full px-12 gap-6">
      <Text variant="h1">Skapa bevakning</Text>

      {/* --- AREA --- */}
      <View className="gap-1.5">
        <Label htmlFor="create-area">Område</Label>
        <Input
          id="create-area"
          placeholder="Sök område..."
          returnKeyType="next"
          submitBehavior="submit"
          value={area}
          onChangeText={setArea}
          editable={!isLoading}
          textContentType="addressCity"
        />
      </View>

      {/* --- PROPERTY TYPE --- */}
      <View>
        <Label>Bostadstyp</Label>
        <ToggleGroup
          type="multiple"
          aria-label="Bostadstyp"
          value={propertyType}
          onValueChange={setPropertyType}
          className="gap-2"
          variant="secondary"
        >
          {existingPropertyTypes.map((p) => (
            <ToggleGroupItem key={p} value={p} aria-label={`Boendetyp ${p}`}>
              <Text className="m-2">{capitalize(p)}</Text>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </View>

      {/* --- MIN / MAX SELECTS --- */}
      <FilterSelect
        label={"Minst antal rum"}
        value={rooms}
        onValueChange={setRooms}
        options={ROOM_OPTIONS}
      />

      <FilterSelect
        label={"Högsta månadsavgift"}
        value={monthlyFee}
        onValueChange={setMonthlyFee}
        options={MONTHLY_FEE_OPTIONS}
      />

      <FilterSelect
        label={"Minsta boarea"}
        value={livingArea}
        onValueChange={setLivingArea}
        options={LIVING_AREA_OPTIONS}
      />

      {/* --- NEW PRODUCTION --- */}
      <View className="flex-row items-center justify-between">
        <Label containerClassName="mb-0">Visa nyproduktion</Label>
        <Switch
          checked={showNewProduction}
          onCheckedChange={setShowNewProduction}
        />
      </View>

      {/* --- INFORMATION INTERVAL --- */}
      <View className="gap-4">
        <Text variant="bold">Hur ofta vill du bli informerad?</Text>
        <View className="flex-row justify-between">
          <View className="flex-row items-center gap-4">
            <Label containerClassName="mb-0">Varje dag</Label>
            <Checkbox
              checked={informationInterval === "day"}
              onCheckedChange={() => setInformationInterval("day")}
            ></Checkbox>
          </View>
          <View className="flex-row items-center gap-4">
            <Label containerClassName="mb-0">Varje vecka</Label>
            <Checkbox
              checked={informationInterval === "week"}
              onCheckedChange={() => setInformationInterval("week")}
            ></Checkbox>
          </View>
        </View>
      </View>

      {/* --- SUBMIT --- */}
      {error && <FormError>{error}</FormError>}

      <View className="items-center mt-10">
        <Button variant="secondary" className="max-w-44">
          <Text>Skapa bevakning</Text>
        </Button>
      </View>
    </View>
  );
}
