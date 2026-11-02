import { Area, Municipality } from "@/services/places";
import { View } from "react-native";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Text } from "../ui/text";

type AreaPickerProps = {
  // The municipalities the user has chosen
  municipalities: Municipality[];
  // All areas, filtered per municipality below
  areas: Area[];
  selected: string[];
  onChange: (names: string[]) => void;
};

export default function AreaPicker({
  municipalities,
  areas,
  selected,
  onChange,
}: AreaPickerProps) {
  // Only municipalities that have areas to choose from
  const groups = municipalities
    .map((m) => ({
      municipality: m,
      municipalityAreas: areas.filter((a) => a.municipality_id === m.id),
    }))
    .filter((g) => g.municipalityAreas.length > 0);

  if (groups.length === 0) return null;

  function toggle(name: string, checked: boolean) {
    onChange(
      checked ? [...selected, name] : selected.filter((n) => n !== name),
    );
  }

  return (
    <View className="gap-4">
      <View>
        <Label>Område</Label>
        <Text>Välj inget område för att bevaka hela kommunen.</Text>
      </View>

      {/* TODO: Decide on exact layout */}
      {groups.map(({ municipality, municipalityAreas }) => (
        <View key={municipality.id} className="gap-2">
          <Text variant="bold">{municipality.name}</Text>
          <View className="flex-row flex-wrap gap-2 justify-between">
            {municipalityAreas.map((a) => (
              <View key={a.id} className="flex-row items-center gap-3 w-[45%]">
                <Checkbox
                  checked={selected.includes(a.name)}
                  onCheckedChange={(checked) => toggle(a.name, checked)}
                />
                <Label containerClassName="mb-0">
                  {a.display_name ?? a.name}
                </Label>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
