import { Municipality } from "@/services/places";
import { X } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Icon } from "../ui/icon";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Text } from "../ui/text";

// Database allows max 10 municipalities per search
const MAX_MUNICIPALITIES = 10;
// Number of suggestions shown while typing
const MAX_SUGGESTIONS = 6;

type MunicipalityPickerProps = {
  municipalities: Municipality[];
  selected: string[];
  onChange: (names: string[]) => void;
};

export default function MunicipalityPicker({
  municipalities,
  selected,
  onChange,
}: MunicipalityPickerProps) {
  const [query, setQuery] = useState("");
  const isFull = selected.length >= MAX_MUNICIPALITIES;

  // Matches anywhere in the name, names starting with the query first
  const search = query.trim().toLocaleLowerCase("sv");
  const startsWithSearch = (m: Municipality) =>
    m.name.toLocaleLowerCase("sv").startsWith(search);
  const suggestions = search
    ? municipalities
        .filter(
          (m) =>
            !selected.includes(m.name) &&
            m.name.toLocaleLowerCase("sv").includes(search),
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
      <Label htmlFor="create-municipality">Kommun*</Label>

      {/* Wrapper so suggestions can be placed right below the input.
          z-10 places it above the chips below (needed on web) */}
      <View className="relative z-10">
        <Input
          id="create-municipality"
          placeholder={isFull ? "Max 10 kommuner" : "Sök kommuner"}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => {
            if (suggestions[0]) add(suggestions[0].name);
          }}
          submitBehavior="submit"
          editable={!isFull}
          autoCorrect={false}
          textContentType="addressCity"
        />

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View className="absolute top-full left-0 right-0 mt-1 rounded-sm border border-input bg-background shadow-md z-10">
            {suggestions.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => add(m.name)}
                role="button"
                className="px-3 py-2 active:bg-muted hover:bg-muted"
              >
                <Text>{m.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Selected */}
      {selected.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-1 z-0">
          {selected.map((name) => (
            <Pressable
              key={name}
              onPress={() => remove(name)}
              role="button"
              aria-label={`Ta bort ${name}`}
              className="flex-row items-center gap-1 rounded-sm bg-secondary px-3 py-2"
            >
              <Text className="text-secondary-foreground text-sm">{name}</Text>
              <Icon as={X} className="size-4 text-secondary-foreground" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
