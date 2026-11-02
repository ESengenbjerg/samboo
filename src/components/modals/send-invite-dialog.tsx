import FormError from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { PlusSquare, X } from "lucide-react-native";
import { useState } from "react";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Icon } from "../ui/icon";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type SendInviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (emails: string[]) => void | Promise<unknown>;
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
  const [emails, setEmails] = useState<string[]>([""]);
  const { height } = useWindowDimensions();

  function handleOpenChange(open: boolean) {
    if (!open) setEmails([""]);
    onOpenChange(open);
  }

  function updateEmail(index: number, value: string) {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  }

  function addEmail() {
    setEmails((prev) => [...prev, ""]);
  }

  function removeEmail(index: number) {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[80vw] flex-col">
        <DialogHeader>
          <DialogTitle>Skicka inbjudan</DialogTitle>
        </DialogHeader>

        <ScrollView
          className="w-full"
          style={{ maxHeight: Math.max(180, height * 0.5) }}
          contentContainerClassName="gap-4"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            {emails.map((email, i) => (
              <View key={i} className="mt-4">
                <Label htmlFor={`invite-email-${i}`}>
                  {i > 0 ? `E-post ${i + 1}` : `E-post`}
                </Label>
                <View className="relative">
                  <Input
                    id={`invite-email-${i}`}
                    placeholder="m@example.com"
                    value={email}
                    onChangeText={(text) => updateEmail(i, text)}
                    keyboardType="email-address"
                    autoComplete="email"
                    autoCapitalize="none"
                    returnKeyType="next"
                    submitBehavior="submit"
                    textContentType="emailAddress"
                    editable={!isLoading}
                    className={i > 0 ? "pr-10" : undefined}
                  />
                  {i > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onPress={() => removeEmail(i)}
                      className="absolute right-0 active:bg-transparent hover:bg-input hover:text-primary"
                    >
                      <Icon as={X} />
                    </Button>
                  )}
                </View>
              </View>
            ))}
          </View>
          <View className="mr-auto">
            <Button
              variant="ghost"
              onPress={addEmail}
              className="self-start min-h-0 px-0 py-0 justify-start"
              style={Platform.select({
                web: { marginLeft: -12 },
                default: undefined,
              })}
              disabled={emails.length > 9 || isLoading}
            >
              <Icon as={PlusSquare} className="size-[18px]" />
              <Text>
                {emails.length > 9
                  ? "Du har nått gränsen på 10 personer"
                  : "Lägg till"}
              </Text>
            </Button>
          </View>
        </ScrollView>

        <DialogFooter>
          <View className="flex-1 gap-4">
            {error && <FormError>{error}</FormError>}
            <Button
              onPress={() => {
                const valid = emails.map((e) => e.trim()).filter(Boolean);
                onAction(valid);
              }}
              disabled={isLoading}
            >
              <Text>{isLoading ? "Skickar inbjudan" : "Skicka inbjudan"}</Text>
            </Button>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
