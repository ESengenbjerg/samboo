import { SelectOption } from "@/types/select-option";
import { useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { Label } from "../ui/label";
import {
  NativeSelectScrollView,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type FilterSelectProps = {
  label: string;
  value: SelectOption | undefined;
  onValueChange: (option: SelectOption | undefined) => void;
  options: SelectOption[];
};

export default function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: FilterSelectProps) {
  // Dropdowns should be as wide as their trigger
  const [triggerWidth, setTriggerWidth] = useState<number>();
  const onTriggerLayout = (e: LayoutChangeEvent) =>
    setTriggerWidth(e.nativeEvent.layout.width);
  const contentStyle = triggerWidth ? { width: triggerWidth } : undefined;

  return (
    <View className="gap-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full" onLayout={onTriggerLayout}>
          <SelectValue placeholder="Välj" />
        </SelectTrigger>
        <SelectContent style={contentStyle}>
          <NativeSelectScrollView>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value} label={o.label} />
            ))}
          </NativeSelectScrollView>
        </SelectContent>
      </Select>
    </View>
  );
}
