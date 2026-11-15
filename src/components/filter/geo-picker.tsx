import { MAX_AREAS, MAX_MUNICIPALITIES } from "@/constants/limits";
import { Area, Municipality } from "@/services/places";
import { X } from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { Icon } from "../ui/icon";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Text } from "../ui/text";

// Number of suggestions shown while typing
const MAX_SUGGESTIONS = 6;

// Android does not deliver touches to views outside their parent's bounds, so a
// dropdown placed with "absolute top-full" can't be tapped there. On native the list
// is therefore placed in the layout flow instead
const DROPDOWN_POSITION = Platform.select({
  web: "absolute top-full left-0 right-0 shadow-md z-10",
  default: "mt-1",
});

// Texts and limits per type. The limits mirror search_params_place_limit, see constants/limits.ts
const CONFIG = {
  municipality: {
    label: "Kommun*",
    placeholder: "Sök kommuner",
    fullPlaceholder: `Max ${MAX_MUNICIPALITIES} kommuner`,
    max: MAX_MUNICIPALITIES,
    id: "municipality",
    textContentType: "addressCity",
  },
  area: {
    label: "Område",
    placeholder: "Sök område",
    fullPlaceholder: `Max ${MAX_AREAS} områden`,
    max: MAX_AREAS,
    id: "area",
    textContentType: undefined,
  },
} as const;

// What the user sees. Areas can have a display_name, name is what is saved
function labelOf(location: Municipality | Area) {
  return ("display_name" in location && location.display_name) || location.name;
}

function normalize(text: string) {
  return text
    .toLocaleLowerCase("sv")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type GeoPickerProps = {
  locations: (Municipality | Area)[];
  locationType: "municipality" | "area";
  selected: string[];
  onChange: (names: string[]) => void;
  mainColor?: "secondary" | "primary";
  fieldColor?: "bg-white" | "bg-input";
};

export default function GeoPicker({
  locations,
  locationType,
  selected,
  onChange,
  mainColor = "secondary",
  fieldColor = "bg-input",
}: GeoPickerProps) {
  const [query, setQuery] = useState("");
  const config = CONFIG[locationType];
  const isFull = selected.length >= config.max;

  // Matches anywhere in the label, labels starting with the query first
  const search = normalize(query.trim());
  const startsWithSearch = (l: Municipality | Area) =>
    normalize(labelOf(l)).startsWith(search);
  const suggestions = search
    ? locations
        .filter(
          (l) =>
            !selected.includes(l.name) &&
            normalize(labelOf(l)).includes(search),
        )
        .sort(
          (a, b) => Number(startsWithSearch(b)) - Number(startsWithSearch(a)),
        )
        .slice(0, MAX_SUGGESTIONS)
    : [];

  function add(name: string) {
    onChange([...selected, name]);
    setQuery("");
  }

  function remove(name: string) {
    onChange(selected.filter((n) => n !== name));
  }

  return (
    <View className="relative z-10 gap-1.5">
      <Label htmlFor={`create-${config.id}`}>{config.label}</Label>
      {locationType === "area" && (
        <Text variant="small" className="pb-2">
          Lämna område tomt för att söka i hela kommunen.
        </Text>
      )}

      {/* Wrapper so suggestions can be placed right below the input.
          z-10 places it above the chips below (needed on web) */}
      <View className="relative z-10">
        <Input
          id={`create-${config.id}`}
          aria-label={config.label.replace("*", "")}
          placeholder={isFull ? config.fullPlaceholder : config.placeholder}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => {
            if (suggestions[0]) add(suggestions[0].name);
          }}
          submitBehavior="submit"
          editable={!isFull}
          autoCorrect={false}
          textContentType={config.textContentType}
          className={fieldColor}
        />

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View className={`${DROPDOWN_POSITION} mt-1 rounded-sm border border-input bg-white`}>
            {suggestions.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => add(l.name)}
                role="button"
                className="px-3 py-2 active:bg-muted hover:bg-muted"
              >
                <Text>{labelOf(l)}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* If 0 suggestions */}
        {search && suggestions.length === 0 ? (
          <View className={`${DROPDOWN_POSITION} mt-1 p-2 gap-2 rounded-sm border border-input bg-background`}>
            <Text variant="bold">{`Inga träffar för "${query.trim()}".`}</Text>
            {locationType === "area" ? (
              <Text>
                Prova ett större område eller lämna tomt fält för att söka i
                hela kommunen.
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Selected */}
      {selected.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-1 z-0">
          {selected.map((name) => {
            // Map the saved name to its label. Falls back to name
            const location = locations.find((l) => l.name === name);
            const text = location ? labelOf(location) : name;
            return (
              <Pressable
                key={name}
                onPress={() => remove(name)}
                role="button"
                aria-label={`Ta bort ${text}`}
                className={`flex-row items-center gap-1 rounded-sm px-3 py-2 ${
                  mainColor === "primary" ? "bg-primary" : "bg-secondary"
                }`}
              >
                <Text
                  className={`text-sm ${
                    mainColor === "primary"
                      ? "text-foreground"
                      : "text-secondary-foreground"
                  }`}
                >
                  {text}
                </Text>
                <Icon
                  as={X}
                  className={`size-4 ${
                    mainColor === "primary"
                      ? "text-foreground"
                      : "text-secondary-foreground"
                  }`}
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
