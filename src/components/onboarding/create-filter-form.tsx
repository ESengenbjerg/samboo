import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LIVING_AREA_OPTIONS,
  MONTHLY_FEE_OPTIONS,
  PROPERTY_TYPES_OPTIONS,
  ROOM_OPTIONS,
} from "@/constants/filter-options";
import { useOnboardingHydrated } from "@/hooks/useOnboardingHydrated";
import { usePlaces } from "@/hooks/usePlaces";
import {
  ClientFilter,
  ScraperFilter,
  useOnboardingStore,
} from "@/stores/onboarding";
import { SelectOption } from "@/types/select-option";
import { capitalize } from "@/utils/capitalize-string";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import AreaPicker from "./area-picker";
import FilterSelect from "./filter-select";
import MunicipalityPicker from "./municipality-picker";

export default function CreateFilterForm() {
  // Wait until the store is hydrated, otherwise the saved values
  // are still null/default and the form would start with empty values
  const hasHydrated = useOnboardingHydrated();
  if (!hasHydrated) return null;

  return <CreateFilterFields />;
}

function CreateFilterFields() {
  const [error, setError] = useState<string | null>(null);
  const setFilters = useOnboardingStore((s) => s.setFilters);

  // Fetches made choices in case user has started onboarding and then leaves app, after making filter choices
  const savedScrapeFilter = useOnboardingStore((s) => s.scraperFilter);
  const savedClientFilter = useOnboardingStore((s) => s.clientFilter);
  const savedInformationInterval = useOnboardingStore(
    (s) => s.informationInterval,
  );

  // Filter alternatives
  // Used to save user input before saving to scraperFilter and clientFilter
  const [municipalities, setMunicipalities] = useState<string[]>(
    savedScrapeFilter?.municipalities ?? [],
  );
  const [areas, setAreas] = useState<string[]>(savedClientFilter?.area ?? []);

  const [propertyType, setPropertyType] = useState<string[]>(
    savedScrapeFilter?.propertyTypes ?? [],
  );
  const [rooms, setRooms] = useState<SelectOption | undefined>(
    ROOM_OPTIONS.find((o) => Number(o.value) === savedClientFilter?.minRooms),
  );
  const [monthlyFee, setMonthlyFee] = useState<SelectOption | undefined>(
    MONTHLY_FEE_OPTIONS.find(
      (o) => Number(o.value) === savedClientFilter?.maxMonthlyFee,
    ),
  );
  const [livingArea, setLivingArea] = useState<SelectOption | undefined>(
    LIVING_AREA_OPTIONS.find(
      (o) => Number(o.value) === savedClientFilter?.minLivingArea,
    ),
  );
  const [showNewProduction, setShowNewProduction] = useState(
    savedClientFilter?.showNewProduction ?? true,
  );
  const [informationInterval, setInformationInterval] = useState<
    "day" | "week"
  >(savedInformationInterval);

  const {
    municipalities: allMunicipalities,
    areas: allAreas,
    isLoading: isLoadingPlaces,
    error: placesError,
  } = usePlaces();

  // The chosen municipalities as objects, AreaPicker needs their id
  const selectedMunicipalities = allMunicipalities.filter((m) =>
    municipalities.includes(m.name),
  );

  // Removes areas of a removed municipality. The database rejects
  // a search with an area outside the chosen municipalities
  function onMunicipalitiesChange(names: string[]) {
    setMunicipalities(names);

    const ids = allMunicipalities
      .filter((m) => names.includes(m.name))
      .map((m) => m.id);
    const allowedAreas = allAreas
      .filter((a) => ids.includes(a.municipality_id))
      .map((a) => a.name);
    setAreas((prev) => prev.filter((name) => allowedAreas.includes(name)));
  }

  function onSubmit() {
    setError(null);

    if (municipalities.length === 0 && propertyType.length === 0) {
      setError(
        "Du måste lägga till minst en kommun och bostadstyp för att spara.",
      );
      return;
    }
    if (municipalities.length === 0) {
      setError("Du måste lägga till minst en kommun för att spara.");
      return;
    }
    if (propertyType.length === 0) {
      setError("Du måste lägga till minst en bostadstyp för att spara.");
      return;
    }

    const scraperFilter: ScraperFilter = {
      municipalities,
      propertyTypes: propertyType,
    };

    const clientFilter: ClientFilter = {
      area: areas,
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
      <View className="gap-4">
        <Text variant="h1">Skapa bevakning</Text>
        <Text>Du kan uppdatera dina val via inställningar senare.</Text>
      </View>

        {/* --- MUNICIPALITIES AND AREA --- */}
      <View className="gap-6 z-10">
        {isLoadingPlaces ? (
          <Text>Laddar kommuner...</Text>
        ) : placesError ? (
          <FormError>{placesError}</FormError>
        ) : (
          <>
            <MunicipalityPicker
              municipalities={allMunicipalities}
              selected={municipalities}
              onChange={onMunicipalitiesChange}
            />
            <AreaPicker
              municipalities={selectedMunicipalities}
              areas={allAreas}
              selected={areas}
              onChange={setAreas}
            />
          </>
        )}
      </View>

      {/* --- PROPERTY TYPE --- */}
      <View className="gap-1.5 z-0">
        <Label>Bostadstyp*</Label>
        <ToggleGroup
          type="multiple"
          aria-label="Bostadstyp"
          value={propertyType}
          onValueChange={setPropertyType}
          className="gap-2 flex-wrap"
          variant="secondary"
        >
          {PROPERTY_TYPES_OPTIONS.map((p) => (
            <ToggleGroupItem
              key={p.value}
              value={p.value}
              aria-label={`Boendetyp ${p.label}`}
              className="flex-none shrink-0"
            >
              <Text className="p-2">{capitalize(p.label)}</Text>
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
