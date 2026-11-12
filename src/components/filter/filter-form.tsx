import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  isPropertyType,
  LIVING_AREA_OPTIONS,
  MONTHLY_FEE_OPTIONS,
  NO_LIMIT_LABEL,
  NO_LIMIT_OPTION,
  NO_LIMIT_VALUE,
  PROPERTY_TYPES_OPTIONS,
  PropertyType,
  ROOM_OPTIONS,
} from "@/constants/filter-options";
import { usePlaces } from "@/hooks/usePlaces";
import { ClientFilter, ScraperFilter } from "@/stores/onboarding";
import { SelectOption } from "@/types/select-option";
import { capitalize } from "@/utils/capitalize-string";
import { ReactNode, useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { Switch } from "../ui/switch";
import FilterSelect from "./filter-select";
import GeoPicker from "./geo-picker";

// "Ingen gräns" first, so a chosen limit can be cleared again
const ROOM_SELECT_OPTIONS = [NO_LIMIT_OPTION, ...ROOM_OPTIONS];
const MONTHLY_FEE_SELECT_OPTIONS = [NO_LIMIT_OPTION, ...MONTHLY_FEE_OPTIONS];
const LIVING_AREA_SELECT_OPTIONS = [NO_LIMIT_OPTION, ...LIVING_AREA_OPTIONS];

// "Ingen gräns" is stored as no value, so the placeholder shows it
function withoutNoLimit(option: SelectOption | undefined) {
  return option?.value === NO_LIMIT_VALUE ? undefined : option;
}

type FilterFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  // Values the form starts with. null means nothing saved yet
  savedScraperFilter: ScraperFilter | null;
  savedClientFilter: ClientFilter | null;
  onSave: (scraperFilter: ScraperFilter, clientFilter: ClientFilter) => void;
  informationInterval?: ReactNode;
  mainColor?: "secondary" | "primary";
  fieldColor?: "bg-white" | "bg-input";
};

export default function FilterForm({
  title,
  description,
  submitLabel,
  savedScraperFilter,
  savedClientFilter,
  onSave,
  informationInterval,
  mainColor = "secondary",
  fieldColor = "bg-input",
}: FilterFormProps) {
  // Set on the first submit. The field errors below are derived from it,
  // so each one disappears as soon as the field is filled in
  const [submitted, setSubmitted] = useState(false);

  // Filter alternatives
  // Used to save user input before saving to scraperFilter and clientFilter
  const [municipalities, setMunicipalities] = useState<string[]>(
    savedScraperFilter?.municipalities ?? [],
  );
  const [areas, setAreas] = useState<string[]>(savedClientFilter?.area ?? []);

  const [propertyType, setPropertyType] = useState<PropertyType[]>(
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
  const [showNewConstruction, setShowNewConstruction] = useState(
    savedClientFilter?.showNewConstruction ?? true,
  );

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

  const missingMunicipality = submitted && municipalities.length === 0;
  const missingPropertyType = submitted && propertyType.length === 0;
  const hasMissing = missingMunicipality || missingPropertyType;

  function onSubmit() {
    setSubmitted(true);
    if (municipalities.length === 0 || propertyType.length === 0) return;

    const scraperFilter: ScraperFilter = {
      municipalities,
      propertyTypes: propertyType,
    };

    const clientFilter: ClientFilter = {
      area: areas,
      minRooms: rooms ? Number(rooms.value) : undefined,
      maxMonthlyFee: monthlyFee ? Number(monthlyFee.value) : undefined,
      minLivingArea: livingArea ? Number(livingArea.value) : undefined,
      showNewConstruction: showNewConstruction,
    };

    onSave(scraperFilter, clientFilter);
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
          <Spinner size="large" />
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
                mainColor={mainColor}
                fieldColor={fieldColor}
              />
              {missingMunicipality && (
                <FormError className="mt-2">
                  Lägg till minst en kommun.
                </FormError>
              )}
            </View>
            {availableAreas.length > 0 && (
              <GeoPicker
                locations={availableAreas}
                locationType="area"
                selected={areas}
                onChange={setAreas}
                mainColor={mainColor}
                fieldColor={fieldColor}
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
          onValueChange={(values) =>
            setPropertyType(values.filter(isPropertyType))
          }
          className="gap-2 flex-wrap"
          variant="secondary"
        >
          {PROPERTY_TYPES_OPTIONS.map((p) => (
            <ToggleGroupItem
              key={p.value}
              value={p.value}
              aria-label={`Bostadstyp ${p.label}`}
              className="flex-none shrink-0"
              variant="outline"
              size="lg"
            >
              <Text className="p-2">{capitalize(p.label)}</Text>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {missingPropertyType && (
          <FormError className="mt-2">Välj minst en bostadstyp.</FormError>
        )}
      </View>

      {/* --- MIN / MAX SELECTS --- */}
      <FilterSelect
        label={"Minst antal rum"}
        value={rooms}
        onValueChange={(o) => setRooms(withoutNoLimit(o))}
        options={ROOM_SELECT_OPTIONS}
        placeholder={NO_LIMIT_LABEL}
        fieldColor={fieldColor}
        fullWidth
      />

      <FilterSelect
        label={"Högsta månadsavgift"}
        value={monthlyFee}
        onValueChange={(o) => setMonthlyFee(withoutNoLimit(o))}
        options={MONTHLY_FEE_SELECT_OPTIONS}
        placeholder={NO_LIMIT_LABEL}
        fieldColor={fieldColor}
        fullWidth
      />

      <FilterSelect
        label={"Minsta boarea"}
        value={livingArea}
        onValueChange={(o) => setLivingArea(withoutNoLimit(o))}
        options={LIVING_AREA_SELECT_OPTIONS}
        placeholder={NO_LIMIT_LABEL}
        fieldColor={fieldColor}
        fullWidth
      />

      {/* --- NEW PRODUCTION --- */}
      {/* The label also toggles, so the hit area is the whole row, not only the small switch */}
      <View className="flex-row items-center justify-between min-h-11">
        <Label
          containerClassName="mb-0"
          onPress={() => setShowNewConstruction((v) => !v)}
        >
          Visa nyproduktion
        </Label>
        <Switch
          checked={showNewConstruction}
          onCheckedChange={setShowNewConstruction}
        />
      </View>

      {/* --- INFORMATION INTERVAL --- */}
      {informationInterval}

      {/* --- SUBMIT --- */}
      {/* Short reminder next to the button. The details are shown at each field */}
      {hasMissing && (
        <FormError>Fyll i de obligatoriska fälten ovanför.</FormError>
      )}

      <View className="items-center mt-6">
        <Button
          variant={mainColor === "primary" ? "default" : "secondary"}
          className="max-w-44"
          onPress={onSubmit}
        >
          <Text>{submitLabel}</Text>
        </Button>
      </View>
    </View>
  );
}
