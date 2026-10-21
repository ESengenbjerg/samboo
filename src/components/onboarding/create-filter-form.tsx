import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LIVING_AREA_OPTIONS,
  MONTHLY_FEE_OPTIONS,
  ROOM_OPTIONS,
} from "@/constants/filter-options";
import {
  ClientFilter,
  ScraperFilter,
  useOnboardingStore,
} from "@/stores/onboarding";
import { SelectOption } from "@/types/select-option";
import { capitalize } from "@/utils/capitalize-string";
import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import FilterSelect from "./filter-select";

export default function CreateFilterForm() {
  // TODO: setIsLoading will be used once Supabase implementation is complete
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setFilters = useOnboardingStore((s) => s.setFilters);

  const [existingPropertyTypes, setExistingPropertyTypes] = useState<string[]>(
    [],
  );

  // Filter alternatives
  // Used to save user input before saving to scraperFilter and clientFilter
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
          // TODO: Show an error (setError) if this fails. Without property types
          // the user can't pass validation in onSubmit and is stuck on this screen
          console.log("Failed to load propertyTypes");
        } else {
          const types = data.map((row) => row.property_type).filter(Boolean);
          setExistingPropertyTypes([...new Set(types)]);
        }
      });
  }, []);

  function onSubmit() {
    setError(null);
    // setIsLoading(true);

    if (!area && propertyType.length === 0) {
      setError(
        "Du måste lägga till minst ett område och bostadstyp för att spara.",
      );
      return;
    }
    if (!area) {
      setError("Du måste lägga till minst ett område för att spara.");
      return;
    }
    if (propertyType.length === 0) {
      setError("Du måste lägga till minst en bostadstyp för att spara.");
      return;
    }

    const scraperFilter: ScraperFilter = {
      area: area.trim(),
      propertyTypes: propertyType,
    };

    const clientFilter: ClientFilter = {
      minRooms: rooms ? Number(rooms.value) : undefined,
      maxMonthlyFee: monthlyFee ? Number(monthlyFee.value) : undefined,
      minLivingArea: livingArea ? Number(livingArea.value) : undefined,
      showNewProduction,
    };

    // TODO: Going back from /connect and submitting again is OK for now
    // since setFilters overwrites previous values
    setFilters(scraperFilter, clientFilter, informationInterval);
    router.push({ pathname: "/connect" });
  }

  return (
    <View className="flex-1 justify-center w-full px-8 gap-6">
      <Text variant="h1">Skapa bevakning</Text>

      {/* --- AREA --- */}
      <View className="gap-1.5">
        <Label htmlFor="create-area">Område*</Label>
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
      <View className="gap-1.5">
        <Label>Bostadstyp*</Label>
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
        <Button variant="secondary" className="max-w-44" onPress={onSubmit}>
          <Text>Skapa bevakning</Text>
        </Button>
      </View>
    </View>
  );
}
