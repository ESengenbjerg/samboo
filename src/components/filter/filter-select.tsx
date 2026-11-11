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
};

export default function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  fieldColor = "bg-input",
  placeholder,
}: FilterSelectProps) {
  return (
    <View className="gap-1.5">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={`${fieldColor} w-full justify-between`}>
          <SelectValue placeholder={placeholder ? placeholder : "Välj"} />
        </SelectTrigger>
        <SelectContent className="min-w-44">
          <SelectGroup>
            {label && <SelectLabel>{label}</SelectLabel>}
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
