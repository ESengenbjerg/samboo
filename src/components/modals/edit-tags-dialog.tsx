import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { TAG_NAME_MAX_LENGTH } from "@/constants/limits";
import { UserTag } from "@/types/tags";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type EditTagsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: UserTag;
  onSave: (newName: string) => void;
  onDelete: () => void;
  isSaving: boolean;
  error: string | null;
  onClearError: () => void;
};

export function EditTagsDialog({
  open,
  onOpenChange,
  tag,
  onSave,
  onDelete,
  isSaving,
  error,
  onClearError,
}: EditTagsDialogProps) {
  const [name, setName] = useState(tag.tag_name);
  const isEmpty = name.trim() === "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-8">
        <DialogHeader>
          <DialogTitle>Redigera tagg</DialogTitle>
        </DialogHeader>

        <View className="gap-2">
          {/* --- Change name --- */}
          <View className="gap-2">
            <View className="flex-row gap-2">
              <Label>Byt namn</Label>
              <Text variant="small">(max {TAG_NAME_MAX_LENGTH} tecken)</Text>
            </View>
            <Input
              value={name}
              onChangeText={(text) => {
                setName(text);
                // The old error were about the previous text
                onClearError();
              }}
              maxLength={TAG_NAME_MAX_LENGTH}
            />
            {error && <FormError>{error}</FormError>}
          </View>
        </View>

        <DialogFooter>
          <View className="flex-1 flex-row gap-2">
            <Button
              className="flex-1"
              disabled={isSaving || isEmpty}
              onPress={() => onSave(name)}
            >
              <Text>{isSaving ? "Sparar..." : "Spara"}</Text>
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              disabled={isSaving}
              onPress={onDelete}
            >
              <Text>Radera</Text>
            </Button>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
