import { Label } from "@/components/ui/label";
import { SelectOption } from "@/types/select-option";
import { View } from "react-native";
import {
  NativeSelectScrollView,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type FilterSelectProps = {
  label?: string;
  value: SelectOption | undefined;
  onValueChange: (option: SelectOption | undefined) => void;
  options: SelectOption[];
  fieldColor?: "bg-white" | "bg-input";
  placeholder?: string;
  dropdownLabel?: string;
  fullWidth?: boolean;
};

export default function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  fieldColor = "bg-input",
  placeholder,
  dropdownLabel,
  fullWidth,
}: FilterSelectProps) {
  // Accessible name: what the field is, plus the chosen value (the visible value
  // would otherwise be replaced by the label for screen readers)
  const fieldName = label ?? dropdownLabel ?? placeholder ?? "Välj";
  const accessibleName = value ? `${fieldName}: ${value.label}` : fieldName;

  return (
    <View className="gap-1.5">
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          aria-label={accessibleName}
          className={`${fieldColor} justify-between ${fullWidth ? "w-full" : ""}`}
        >
          <SelectValue placeholder={placeholder ? placeholder : "Välj"} />
        </SelectTrigger>
        <SelectContent className="min-w-48">
          <SelectGroup>
            {dropdownLabel && <SelectLabel>{dropdownLabel}</SelectLabel>}
            <NativeSelectScrollView>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value} label={o.label} />
              ))}
            </NativeSelectScrollView>
          </SelectGroup>
        </SelectContent>
      </Select>
    </View>
  );
}
