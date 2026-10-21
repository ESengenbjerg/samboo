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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type SaveObjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: () => void;
};

export function SendInviteDialog({
  open,
  onOpenChange,
  onAction,
}: SaveObjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Spara objekt</DialogTitle>
        </DialogHeader>

        <View className="gap-4">
          <View className="gap-2">
            <Label htmlFor="invite-email">E-post</Label>
            <Input
              id="invite-email"
              placeholder="m@example.com"
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              returnKeyType="next"
              submitBehavior="submit"
              textContentType="emailAddress"
              // editable={!isLoading}
            />
          </View>
          <View className="gap-2">
            <Label htmlFor="invite-message">Lägg till en hälsning</Label>
            <Textarea
              id="invite-message"
              placeholder="Hej! Jag vill bjuda in dig att se mina listor..."
              className="h-24"
            />
          </View>
        </View>

        <DialogFooter>
          <View className="flex-1 gap-4">
            <Button onPress={onAction}>
              <Text>Skicka inbjudan</Text>
            </Button>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
