import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type SaveShowingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: { date: string; time: string; note: string }) => void;
};

export function SaveShowingDialog({
  open,
  onOpenChange,
  onSave,
}: SaveShowingDialogProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] flex-col">
        <Pressable
          onPress={Keyboard.dismiss}
          accessible={false}
          className="gap-4"
        >
          <DialogHeader>
            <DialogTitle className="pb-6">Spara visning</DialogTitle>
          </DialogHeader>

          <View>
            <Label>Datum</Label>
            <Input
              placeholder="2027-01-01"
              value={date}
              onChangeText={setDate}
              textContentType="dateTime"
              keyboardType="numbers-and-punctuation"
              inputMode="numeric"
              returnKeyType="next"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          <View className="gap-2">
            <Label>Starttid</Label>
            <Input
              placeholder="11.00"
              value={time}
              onChangeText={setTime}
              textContentType="dateTime"
              keyboardType="numbers-and-punctuation"
              inputMode="numeric"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          <View className="flex-col gap-2">
            <Label>Anteckning</Label>
            <Textarea
              value={note}
              onChangeText={setNote}
              placeholder="Lägg till anteckning..."
              className="h-24"
            />
          </View>

          <DialogFooter className="flex-col pt-6 gap-6">
            <Button
              onPress={() => {
                date && onSave({ date, time, note });
                setDate("");
                setTime("");
                setNote("");
              }}
              disabled={!date}
            >
              <Text>Spara visning</Text>
            </Button>
          </DialogFooter>
        </Pressable>
      </DialogContent>
    </Dialog>
  );
}
