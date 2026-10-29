import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import {
  formatDateLabel,
  startOfToday,
  toTimeString,
} from "@/utils/date-format";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, View } from "react-native";
import { Icon } from "../ui/icon";
import { Check } from "lucide-react-native";

// Same props as showing-date-time-fields.web.tsx
type ShowingDateTimeFieldsProps = {
  date: Date;
  // null = no start time (it is optional)
  time: Date | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date | null) => void;
};

type PickerMode = "date" | "time";

// Showings are usually around midday, so the time picker starts at 12:00
function defaultTime() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

// Date and optional start time for a showing. Both are shown as buttons.
// Android: the button opens the system dialog.
// iOS: the button opens a wheel right below the field. The compact iOS picker can't be used:
// its popover opens behind the dialog, which lives in its own window (FullWindowOverlay).
// The picker does not support web, see showing-date-time-fields.web.tsx
export default function ShowingDateTimeFields({
  date,
  time,
  onDateChange,
  onTimeChange,
}: ShowingDateTimeFieldsProps) {
  const isIOS = Platform.OS === "ios";
  // iOS: which wheel is open, at most one at a time
  const [openPicker, setOpenPicker] = useState<PickerMode | null>(null);

  function onPickerChange(mode: PickerMode, value: Date) {
    if (mode === "date") onDateChange(value);
    else onTimeChange(value);
  }

  function openPickerFor(mode: PickerMode) {
    if (!isIOS) {
      DateTimePickerAndroid.open({
        mode,
        value: mode === "date" ? date : (time ?? defaultTime()),
        is24Hour: true,
        minimumDate: mode === "date" ? startOfToday() : undefined,
        onValueChange: (_event, value) => onPickerChange(mode, value),
      });
      return;
    }

    // The wheel needs a value to show, so adding a start time sets 12:00 first
    if (mode === "time" && time === null) onTimeChange(defaultTime());
    // Pressing the same field again closes its wheel
    setOpenPicker(openPicker === mode ? null : mode);
  }

  function removeTime() {
    onTimeChange(null);
    if (openPicker === "time") setOpenPicker(null);
  }

  function iosWheel(mode: PickerMode, value: Date) {
    return (
      <View className="gap-2">
        <DateTimePicker
          value={value}
          mode={mode}
          display={mode === "date" ? "inline" : "spinner"}
          locale="sv_SE"
          // The app has no dark mode yet, so keep dark text on the white dialog
          themeVariant="light"
          minimumDate={mode === "date" ? startOfToday() : undefined}
          onValueChange={(_event, newValue) => onPickerChange(mode, newValue)}
          style={{
            transform: [{ scale: 0.8 }],
            height: 180,
            width: "100%",
            alignSelf: "center",
          }}
        />
        <Button variant="outline" onPress={() => setOpenPicker(null)}>
          <Text>Klar</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="gap-2">
        <Label>Datum</Label>
        <Button
          variant="outline"
          className="justify-start"
          onPress={() => openPickerFor("date")}
        >
          <Text>{formatDateLabel(date)}</Text>
        </Button>
        {isIOS && openPicker === "date" && iosWheel("date", date)}
      </View>

      <View className="gap-2">
        <Label>Starttid (valfri)</Label>
        <View className="flex-row items-center gap-4">
          <Button variant="outline" onPress={() => openPickerFor("time")}>
            <Text>{time === null ? "Lägg till starttid" : toTimeString(time)}</Text>
          </Button>
          {time !== null && (
            <Button variant="link" onPress={removeTime}>
              <Text>Ta bort</Text>
            </Button>
          )}
        </View>
        {isIOS && openPicker === "time" && time !== null && iosWheel("time", time)}
      </View>
    </View>
  );
}
