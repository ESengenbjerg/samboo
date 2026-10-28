import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { View } from "react-native";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

type SaveObjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: () => void;
};

export function SaveObjectDialog({
  open,
  onOpenChange,
  onAction,
}: SaveObjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw]">
        <DialogHeader>
          <DialogTitle>Spara objekt</DialogTitle>
        </DialogHeader>

        <View className="gap-4">
          <View className="gap-2">
            <Label>Lista</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Välj lista" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Dina listor</SelectLabel>
                  <SelectItem label="Villor" value="houses" />
                  <SelectItem label="Lägenheter" value="appartments" />
                </SelectGroup>
              </SelectContent>
            </Select>
          </View>
          <View className="gap-2">
            <Label>Anteckning</Label>
            <Textarea placeholder="Lägg till anteckning..." className="h-24" />
          </View>
        </View>

        <DialogFooter>
          <View className="flex-1 gap-4">
            <Button onPress={onAction}>
              <Text>Spara objekt</Text>
            </Button>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
