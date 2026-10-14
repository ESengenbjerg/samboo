import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useState } from "react";
import { View } from "react-native";
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
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

type SaveShowingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dates: string[];
  onSave: (values: { date: string; time: string; note: string }) => void;
};

export function SaveShowingDialog({
  open,
  onOpenChange,
  dates,
  onSave,
}: SaveShowingDialogProps) {
  const [date, setDate] = useState<string | undefined>(dates[0]);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw] flex-col">
        <DialogHeader>
          <DialogTitle>Spara visning</DialogTitle>
        </DialogHeader>

        <View>
          <ToggleGroup
            type="single"
            value={date}
            onValueChange={(val) => val && setDate(val)}
            className="flex-row justify-start gap-3"
          >
            {dates.map((d) => (
              <ToggleGroupItem key={d} value={d} aria-label={`Visning ${d}`}>
                <Text>{d}</Text>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </View>

        <View className="space-y-2">
          <Label>Starttid</Label>
          <Input
            value={time}
            onChangeText={setTime}
            keyboardType="numbers-and-punctuation"
            inputMode="numeric"
          />
        </View>

        <View className="flex-col space-y-2">
          <Label>Anteckning</Label>
          <Textarea
            value={note}
            onChangeText={setNote}
            placeholder="Lägg till anteckning..."
            className="h-24"
          />
        </View>

        <DialogFooter className="flex-col pt-6 space-y-6">
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
      </DialogContent>
    </Dialog>
  );
}
