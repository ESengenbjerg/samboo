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
import { useState } from "react";

type SendInviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (email: string) => void;
};

export function SendInviteDialog({
  open,
  onOpenChange,
  onAction,
}: SendInviteDialogProps) {
  const [email, setEmail] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skicka inbjudan</DialogTitle>
        </DialogHeader>

        <View className="gap-4">
          <View className="gap-2">
            <Label htmlFor="invite-email">E-post</Label>
            <Input
              id="invite-email"
              placeholder="m@example.com"
              value={email}
              onChangeText={setEmail}
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
            <Button onPress={() => onAction(email.trim())}>
              {/* TODO: Update text based on loading state */}
              <Text>Skicka inbjudan</Text>
            </Button>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
