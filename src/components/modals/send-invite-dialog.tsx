import FormError from "@/components/form-error";
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

type SendInviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (email: string) => void | Promise<unknown>;
  isLoading?: boolean;
  error?: string | null;
};

export function SendInviteDialog({
  open,
  onOpenChange,
  onAction,
  isLoading,
  error,
}: SendInviteDialogProps) {
  const [email, setEmail] = useState("");

  function handleOpenChange(open: boolean) {
    if (!open) setEmail("");
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              editable={!isLoading}
            />
          </View>
          {/* <View className="gap-2">
            <Label htmlFor="invite-message">Lägg till en hälsning</Label>
            <Textarea
              id="invite-message"
              placeholder="Hej! Jag vill bjuda in dig att se mina listor..."
              className="h-24"
            />
          </View> */}
        </View>

        <DialogFooter>
          <View className="flex-1 gap-4">
            {error && <FormError>{error}</FormError>}
            <Button
              onPress={() => {
                onAction(email.trim());
              }}
              disabled={isLoading}
            >
              {/* TODO: Update text based on loading state */}
              <Text>{isLoading ? "Skickar inbjudan" : "Skicka inbjudan"}</Text>
            </Button>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
