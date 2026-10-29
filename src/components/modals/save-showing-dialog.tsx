import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { startOfToday, toIsoDate, toTimeString } from "@/utils/date-format";
import { useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import FormError from "../form-error";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import ShowingDateTimeFields from "./showing-date-time-fields";

type SaveShowingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Called when the user presses "Spara visning". The parent saves and closes the dialog.
  // date is "2027-01-15", time is "11:00" or "" if no start time
  onSave: (values: { date: string; time: string; note: string }) => void;
  isSaving: boolean;
  error: string | null;
};

export function SaveShowingDialog({
  open,
  onOpenChange,
  onSave,
  isSaving,
  error,
}: SaveShowingDialogProps) {
  // Starts on today, the user picks the real date
  const [date, setDate] = useState(startOfToday);
  // null = no start time (it is optional)
  const [time, setTime] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const { height } = useWindowDimensions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-80">
        <Pressable
          onPress={Keyboard.dismiss}
          accessible={false}
          className="gap-4"
        >
          <DialogHeader>
            <DialogTitle className="pb-6">Spara visning</DialogTitle>
          </DialogHeader>

          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
            contentContainerClassName="gap-4"
            style={{ maxHeight: height * 0.75 }}
          >
            <ShowingDateTimeFields
              date={date}
              onDateChange={setDate}
              time={time}
              onTimeChange={setTime}
            />

            <View className="flex-col gap-2">
              <Label>Anteckning</Label>
              <Textarea
                value={note}
                onChangeText={setNote}
                placeholder="Lägg till anteckning..."
                className="h-24"
              />
            </View>

            {error && <FormError>{error}</FormError>}

            <DialogFooter className="flex-col gap-6 pt-6">
              <Button
                onPress={() =>
                  onSave({
                    date: toIsoDate(date),
                    time: time ? toTimeString(time) : "",
                    note,
                  })
                }
                disabled={isSaving}
              >
                <Text>{isSaving ? "Sparar..." : "Spara visning"}</Text>
              </Button>
            </DialogFooter>
          </ScrollView>
        </Pressable>
      </DialogContent>
    </Dialog>
  );
}
