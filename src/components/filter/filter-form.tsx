import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  LIVING_AREA_OPTIONS,
  MONTHLY_FEE_OPTIONS,
  PROPERTY_TYPES_OPTIONS,
  ROOM_OPTIONS,
} from "@/constants/filter-options";
import { usePlaces } from "@/hooks/usePlaces";
import {
  ClientFilter,
  InformationInterval,
  ScraperFilter,
} from "@/stores/onboarding";
import { SelectOption } from "@/types/select-option";
import { capitalize } from "@/utils/capitalize-string";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { Button } from "../ui/button";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Switch } from "../ui/switch";
import FilterSelect from "./filter-select";
import GeoPicker from "./geo-picker";

const INTERVAL_OPTIONS: { value: InformationInterval; label: string }[] = [
  { value: "day", label: "Varje dag" },
  { value: "week", label: "Varje vecka" },
  { value: "none", label: "Aldrig" },
];

type FilterFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  // Values the form starts with. null means nothing saved yet
  savedScraperFilter: ScraperFilter | null;
  savedClientFilter: ClientFilter | null;
  savedInformationInterval: InformationInterval;
  onSave: (
    scraperFilter: ScraperFilter,
    clientFilter: ClientFilter,
    informationInterval: InformationInterval,
  ) => void;
};

export default function FilterForm({
  title,
  description,
  submitLabel,
  savedScraperFilter,
  savedClientFilter,
  savedInformationInterval,
  onSave,
}: FilterFormProps) {
  const [error, setError] = useState<string | null>(null);

  // Filter alternatives
  // Used to save user input before saving to scraperFilter and clientFilter
  const [municipalities, setMunicipalities] = useState<string[]>(
    savedScraperFilter?.municipalities ?? [],
  );
  const [areas, setAreas] = useState<string[]>(savedClientFilter?.area ?? []);

  const [propertyType, setPropertyType] = useState<string[]>(
    savedScraperFilter?.propertyTypes ?? [],
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
  const [informationInterval, setInformationInterval] =
    useState<InformationInterval>(savedInformationInterval);

  const {
    municipalities: allMunicipalities,
    areas: allAreas,
    isLoading: isLoadingPlaces,
    error: placesError,
  } = usePlaces();

  // The chosen municipalities as objects, needed to find their areas
  const selectedMunicipalities = allMunicipalities.filter((m) =>
    municipalities.includes(m.name),
  );

  // Only areas in the chosen municipalities can be picked
  const availableAreas = allAreas.filter((a) =>
    selectedMunicipalities.some((m) => m.id === a.municipality_id),
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

    const missing = [
      municipalities.length === 0 && "en kommun",
      propertyType.length === 0 && "en bostadstyp",
    ].filter(Boolean);
    if (missing.length > 0) {
      setError(
        `Du måste lägga till minst ${missing.join(" och ")} för att spara.`,
      );
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

    onSave(scraperFilter, clientFilter, informationInterval);
  }

  return (
    <View className="flex-1 justify-center w-full px-8 gap-6">
      <View className="gap-4">
        <Text variant="h1">{title}</Text>
        <Text>{description}</Text>
      </View>

      {/* --- MUNICIPALITIES AND AREA --- */}
      <View className="gap-6 z-10">
        {isLoadingPlaces ? (
          <Text>Laddar kommuner...</Text>
        ) : placesError ? (
          <FormError>{placesError}</FormError>
        ) : (
          <>
            <View className="z-20">
              <GeoPicker
                locations={allMunicipalities}
                locationType="municipality"
                selected={municipalities}
                onChange={onMunicipalitiesChange}
              />
            </View>
            {availableAreas.length > 0 && (
              <GeoPicker
                locations={availableAreas}
                locationType="area"
                selected={areas}
                onChange={setAreas}
              />
            )}
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
        <RadioGroup
          value={informationInterval}
          onValueChange={(v) =>
            setInformationInterval(v as InformationInterval)
          }
          className="flex-row flex-wrap gap-4 justify-between"
        >
          {INTERVAL_OPTIONS.map((o) => (
            <View
              key={o.value}
              className="flex-row items-center gap-4 min-w-[45%] sm:min-w-[30%]"
            >
              <RadioGroupItem value={o.value} aria-label={o.label} />
              <Label
                containerClassName="mb-0"
                onPress={() => setInformationInterval(o.value)}
              >
                {o.label}
              </Label>
            </View>
          ))}
        </RadioGroup>
      </View>

      {/* --- SUBMIT --- */}
      {error && <FormError>{error}</FormError>}

      <View className="items-center mt-10">
        <Button variant="secondary" className="max-w-44" onPress={onSubmit}>
          <Text>{submitLabel}</Text>
        </Button>
      </View>
    </View>
  );
}
