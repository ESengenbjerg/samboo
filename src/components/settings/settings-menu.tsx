import { capitalize } from "@/utils/capitalize-string";
import { Text } from "../ui/text";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

type SettingsMenuProps = {
  title: string[];
  value: string;
  onValueCange: () => void;
};

export default function SettingsMenu({
  value,
  title,
  onValueCange,
}: SettingsMenuProps) {
  return (
    <>
      <ToggleGroup
        type="single"
        aria-label="Inställningsalternativ"
        value={value}
        onValueChange={onValueCange}
        className="gap-2 flex-wrap"
      >
        {title.map((t) => (
          // TODO: Add links to every heading
          <ToggleGroupItem
            key={t}
            value={t}
            aria-label={`Gå till ${t}`}
            className="flex-none shrink-0"
          >
            <Text className="m-2 text-nowrap">{capitalize(t)}</Text>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </>
  );
}
