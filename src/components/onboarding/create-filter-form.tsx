import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelectScrollView,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/utils/supabase";
import { useEffect, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";

export default function CreateFilterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewProduction, setShowNewProduction] = useState(true);
  const [informationInterval, setInformationInterval] = useState<
    "day" | "week"
  >("day");
  const [area, setArea] = useState("");
  const [existingPropertyTypes, setExistingPropertyTypes] = useState<string[]>(
    [],
  );
  const [propertyType, setPropertyType] = useState<string | undefined>("");
  const [rooms, setRooms] = useState<number | null>(null);
  const [monthlyFee, setMonthlyFee] = useState<number | null>(null);
  const [livingArea, setLivingArea] = useState<number | null>(null);

  // Dropdowns should be as wide as their trigger (web does this via CSS)
  const [triggerWidth, setTriggerWidth] = useState<number>();
  const onTriggerLayout = (e: LayoutChangeEvent) =>
    setTriggerWidth(e.nativeEvent.layout.width);
  const contentStyle = triggerWidth ? { width: triggerWidth } : undefined;

  const roomSelectValues = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const monthlyFeeSelectValues = [3000, 6000, 9000, 12000, 15000];
  const livingAreaSelectValues = [
    "20",
    "30",
    "40",
    "50",
    "60",
    "70",
    "80",
    "90",
    "100",
    "110",
    "120",
    "130",
    "140",
    "150",
    "160",
    "170",
    "180",
    "190",
    "200",
  ];

  useEffect(() => {
    supabase
      .from("listings")
      .select("property_type")
      .then(({ data, error }) => {
        if (error) {
          console.log("Failed to load propertyTypes");
        } else {
          const types = data.map((row) => row.property_type).filter(Boolean);
          setExistingPropertyTypes([...new Set(types)]);
        }
      });
  }, []);

  return (
    <View className="flex-1 justify-center w-full px-12 gap-6">
      <Text variant="h1">Skapa bevakning</Text>

      {/* --- AREA --- */}
      <View className="gap-1.5">
        <Label htmlFor="profile-name">Område</Label>
        <Input
          id="create-area"
          placeholder="Sök område..."
          returnKeyType="next"
          submitBehavior="submit"
          value={area}
          onChangeText={setArea}
          editable={!isLoading}
          textContentType="addressCity"
        />
      </View>

      {/* --- PROPERTY TYPE --- */}
      <View>
        <Label>Bostadstyp</Label>
        <ToggleGroup
          type="single"
          aria-label="Bostadstyp"
          value={propertyType}
          onValueChange={setPropertyType}
          className="gap-2"
          variant="secondary"
        >
          {existingPropertyTypes.map((p) => (
            <ToggleGroupItem key={p} value={p} aria-label={`Boendetyp ${p}`}>
              <Text className="m-2">{p}</Text>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </View>

      {/* --- MIN / MAX SELECTS --- */}
      <View className="gap-6">
        <View>
          <Label>Minst antal rum</Label>
          <View className="flex-row gap-2 justify-between">
            {/* --- Min --- */}
            <Select>
              <SelectTrigger className="w-full" onLayout={onTriggerLayout}>
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent style={contentStyle}>
                <NativeSelectScrollView>
                  {roomSelectValues.map((r) => (
                    <SelectItem
                      key={`min-rooms-${r}`}
                      value={`min-rooms-${r}`}
                      label={
                        roomSelectValues.indexOf(r) ===
                        roomSelectValues.length - 1
                          ? `${r} eller fler`
                          : `${r} rum`
                      }
                    />
                  ))}
                </NativeSelectScrollView>
              </SelectContent>
            </Select>
          </View>
        </View>

        <View>
          <Label>Högtsa månadsavgift</Label>
          <View className="flex-row gap-2 justify-between">
            {/* --- Min --- */}
            <Select>
              <SelectTrigger className="w-full" onLayout={onTriggerLayout}>
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent style={contentStyle}>
                <SelectGroup>
                  {monthlyFeeSelectValues.map((m) => (
                    <SelectItem
                      key={`max-monthly-fee-${m.toString()}`}
                      value={`max-monthly-fee-${m.toString()}`}
                      label={
                        monthlyFeeSelectValues.indexOf(m) ===
                        monthlyFeeSelectValues.length - 1
                          ? `${m.toLocaleString("sv-SE")}kr eller mer`
                          : `${m.toLocaleString("sv-SE")}kr`
                      }
                    />
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </View>
        </View>

        <View>
          <Label>Minsta boarea</Label>
          <View className="flex-row gap-2 justify-between">
            {/* --- Min --- */}
            <Select>
              <SelectTrigger className="w-full" onLayout={onTriggerLayout}>
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent style={contentStyle}>
                <NativeSelectScrollView>
                  {livingAreaSelectValues.map((l) => (
                    <SelectItem
                      key={`min-living-area-${l}`}
                      value={`min-living-area-${l}`}
                      label={
                        livingAreaSelectValues.indexOf(l) ===
                        livingAreaSelectValues.length - 1
                          ? `${l} kvm eller större`
                          : `${l} kvm`
                      }
                    />
                  ))}
                </NativeSelectScrollView>
              </SelectContent>
            </Select>
          </View>
        </View>
      </View>

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
        <View className="flex-row justify-between">
          <View className="flex-row items-center gap-4">
            <Label containerClassName="mb-0">Varje dag</Label>
            <Checkbox
              checked={informationInterval === "day"}
              onCheckedChange={() => setInformationInterval("day")}
            ></Checkbox>
          </View>
          <View className="flex-row items-center gap-4">
            <Label containerClassName="mb-0">Varje vecka</Label>
            <Checkbox
              checked={informationInterval === "week"}
              onCheckedChange={() => setInformationInterval("week")}
            ></Checkbox>
          </View>
        </View>
      </View>

      {/* --- SUBMIT --- */}
      <View className="items-center mt-10">
        <Button variant="secondary" className="max-w-44">
          <Text>Skapa bevakning</Text>
        </Button>
      </View>
    </View>
  );
}
