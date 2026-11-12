import { Text } from "@/components/ui/text";
import {
  InformationInterval,
  isInformationInterval,
} from "@/stores/onboarding";
import { View } from "react-native";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const INTERVAL_OPTIONS: { value: InformationInterval; label: string }[] = [
  { value: "day", label: "Varje dag" },
  { value: "week", label: "Varje vecka" },
  { value: "none", label: "Aldrig" },
];

type InformationIntervalSettingsProps = {
  value: InformationInterval;
  onChange: (value: InformationInterval) => void;
};

export default function InformationIntervalSettings({
  value,
  onChange,
}: InformationIntervalSettingsProps) {
  return (
    <View className="gap-4">
      <Text variant="bold">Hur ofta vill du bli informerad?</Text>
      <RadioGroup
        value={value}
        onValueChange={(v) => {
          if (isInformationInterval(v)) onChange(v);
        }}
        className="flex-row flex-wrap justify-between"
      >
        {INTERVAL_OPTIONS.map((o) => (
          <View
            key={o.value}
            className="flex-row items-center gap-3 min-w-[45%] sm:min-w-[30%]"
          >
            <RadioGroupItem value={o.value} aria-label={o.label} />
            <Label containerClassName="mb-0" onPress={() => onChange(o.value)}>
              {o.label}
            </Label>
          </View>
        ))}
      </RadioGroup>
    </View>
  );
}
