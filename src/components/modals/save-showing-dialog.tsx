import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { SHOWING_NOTE_MAX_LENGTH } from "@/constants/limits";
import {
  defaultShowingTime,
  startOfToday,
  toIsoDate,
  toTimeString,
} from "@/utils/date-format";
import { useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
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
  // Called when the user presses the save button. The parent saves and closes the dialog.
  // date is "2027-01-15", time is "11:00" or "" if no start time
  onSave: (values: { date: string; time: string; note: string }) => void;
  isSaving: boolean;
  error: string | null;
  // Heading and save button text. Default to "Spara visning", set when editing
  title?: string;
  saveLabel?: string;
  // Set when saving failed because the listing already has a showing. Shows a
  // "Ändra befintlig visning" button under the error, as the way forward
  onEditExisting?: () => void;
  // Start values when editing a showing. Without them the dialog starts on today at 12:00
  initialDate?: Date;
  initialTime?: Date;
  initialNote?: string;
};

export function SaveShowingDialog({
  open,
  onOpenChange,
  onSave,
  isSaving,
  error,
  title = "Spara visning",
  saveLabel = "Spara visning",
  onEditExisting,
  initialDate,
  initialTime,
  initialNote,
}: SaveShowingDialogProps) {
  // Only read when the dialog mounts: initial values when editing, otherwise today at 12:00
  const [date, setDate] = useState(initialDate ?? startOfToday);
  const [time, setTime] = useState(initialTime ?? defaultShowingTime);
  const [note, setNote] = useState(initialNote ?? "");
  const { height } = useWindowDimensions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        
          <DialogHeader>
            <DialogTitle className="pb-6">{title}</DialogTitle>
          </DialogHeader>

          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
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
                maxLength={SHOWING_NOTE_MAX_LENGTH}
                className="h-24"
              />
            </View>

            {error && <FormError>{error}</FormError>}

            {onEditExisting && (
              <Button variant="outline" onPress={onEditExisting}>
                <Text>Ändra befintlig visning</Text>
              </Button>
            )}

            <DialogFooter className="flex-col gap-6 pt-6">
              <Button
                onPress={() =>
                  onSave({
                    date: toIsoDate(date),
                    time: toTimeString(time),
                    note,
                  })
                }
                disabled={isSaving}
              >
                <Text>{isSaving ? "Sparar..." : saveLabel}</Text>
              </Button>
            </DialogFooter>
          </ScrollView>
      </DialogContent>
    </Dialog>
  );
}
