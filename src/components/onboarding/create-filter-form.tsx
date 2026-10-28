import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LIVING_AREA_OPTIONS,
  MONTHLY_FEE_OPTIONS,
  PROPERTY_TYPES_OPTIONS,
  ROOM_OPTIONS,
} from "@/constants/filter-options";
import {
  ClientFilter,
  ScraperFilter,
  useOnboardingStore,
} from "@/stores/onboarding";
import { SelectOption } from "@/types/select-option";
import { capitalize } from "@/utils/capitalize-string";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import FilterSelect from "./filter-select";

export default function CreateFilterForm() {
  const [error, setError] = useState<string | null>(null);
  const setFilters = useOnboardingStore((s) => s.setFilters);

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

  // Fetches made choices in case user has started onboarding and then leaves app, after making filter choices
  const savedScrapeFilter = useOnboardingStore((s) => s.scraperFilter);
  const savedClientFilter = useOnboardingStore((s) => s.clientFilter);
  const savedInformationInterval = useOnboardingStore(
    (s) => s.informationInterval,
  );

  // Tracks whether zustand's persist middleware has finished loading
  // the saved state from AsyncStorage. Initialized with the current status,
  // since hydration may already be complete on first render.
  const [hasHydrated, setHasHydrated] = useState(
    useOnboardingStore.persist.hasHydrated(),
  );

  useEffect(() => {
    // Subscribe to the hydration-finished event so the component re-renders
    // when AsyncStorage has been read (hydration is async and may finish late).
    const unsub = useOnboardingStore.persist.onFinishHydration(() =>
      setHasHydrated(true),
    );
    // Covers the case where hydration finished between the first render
    // and this effect, so the event would never fire.
    setHasHydrated(useOnboardingStore.persist.hasHydrated());
    return unsub;
  }, []);

  useEffect(() => {
    // Wait until the store is hydrated, otherwise the saved values
    // are still null/default and would overwrite the form with empty values
    if (!hasHydrated) return;

    // Sets area and propertyType to saved values
    if (savedScrapeFilter) {
      setArea(savedScrapeFilter.area);
      setPropertyType(savedScrapeFilter.propertyTypes);
    }
    // Sets minRooms, maxMonthlyFee, minLivingArea, and showNewProduction to saved values
    if (savedClientFilter) {
      setRooms(
        ROOM_OPTIONS.find(
          (o) => Number(o.value) === savedClientFilter.minRooms,
        ),
      );
      setMonthlyFee(
        MONTHLY_FEE_OPTIONS.find(
          (o) => Number(o.value) === savedClientFilter.maxMonthlyFee,
        ),
      );
      setLivingArea(
        LIVING_AREA_OPTIONS.find(
          (o) => Number(o.value) === savedClientFilter.minLivingArea,
        ),
      );
      setShowNewProduction(savedClientFilter.showNewProduction);
    }
    // Sets informationInterval to saved value
    setInformationInterval(savedInformationInterval);
  }, [hasHydrated]); // Runs once hydration completes.

  function onSubmit() {
    setError(null);

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
          className="flex-1 gap-2 flex-wrap"
          variant="secondary"
        >
          {PROPERTY_TYPES_OPTIONS.map((p) => (
            <ToggleGroupItem
              key={p}
              value={p}
              aria-label={`Boendetyp ${p}`}
              className="flex-none shrink-0"
            >
              <Text className="p-2">{capitalize(p)}</Text>
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
