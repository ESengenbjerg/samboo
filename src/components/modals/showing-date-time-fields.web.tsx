import { Label } from "@/components/ui/label";
import { SHOWING_LAST_DATE } from "@/constants/limits";
import {
  parseIsoDate,
  parseTime,
  toIsoDate,
  toTimeString,
} from "@/utils/date-format";
import { View } from "react-native";

// Same props as showing-date-time-fields.tsx
type ShowingDateTimeFieldsProps = {
  date: Date;
  time: Date;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
};

// Same look as components/ui/input.tsx
const INPUT_CLASS =
  "border-input bg-background text-foreground h-10 w-full rounded-sm border px-3 text-base";

// Web version of the date and time fields. Metro picks this file instead of
// showing-date-time-fields.tsx on web (the .web.tsx extension), since @react-native-community/datetimepicker renders nothing there.
// Uses the browser's own date and time inputs
export default function ShowingDateTimeFields({
  date,
  time,
  onDateChange,
  onTimeChange,
}: ShowingDateTimeFieldsProps) {
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Label>Datum</Label>
        <input
          type="date"
          aria-label="Datum"
          className={INPUT_CLASS}
          value={toIsoDate(date)}
          min={toIsoDate(new Date())}
          max={SHOWING_LAST_DATE}
          onChange={(e) => {
            // Empty when the user clears the field. The date is required, so keep the old one
            // Safari on iPhone ignores max, so clamp here as well. ISO dates compare as strings
            if (e.target.value) {
              const value =
                e.target.value > SHOWING_LAST_DATE
                  ? SHOWING_LAST_DATE
                  : e.target.value;
              onDateChange(parseIsoDate(value));
            }
          }}
        />
      </View>

      <View className="gap-2">
        <Label>Starttid</Label>
        <input
          type="time"
          aria-label="Starttid"
          className={INPUT_CLASS}
          value={toTimeString(time)}
          required
          onChange={(e) => {
            if (e.target.value) onTimeChange(parseTime(e.target.value));
          }}
        />
      </View>
    </View>
  );
}
