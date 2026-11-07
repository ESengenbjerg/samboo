import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { TAG_NAME_MAX_LENGTH } from "@/constants/limits";
import { UserTag } from "@/types/tags";
import { capitalize } from "@/utils/capitalize-string";
import { useState } from "react";
import { Pressable, View } from "react-native";
import FormError from "../form-error";
import CategoryTag from "../tags/category-tag";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
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

type CategoriesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: UserTag[];
  selectedIds: number[];
  onCreateCategory: (name: string) => Promise<UserTag | null>;
  onSave: (selectedIds: number[], initialIds: number[]) => void;
  isSaving: boolean;
  error: string | null;
  onClearError: () => void;
};

export function CategoriesDialog({
  open,
  onOpenChange,
  categories,
  selectedIds,
  onCreateCategory,
  onSave,
  isSaving,
  error,
  onClearError,
}: CategoriesDialogProps) {
  // What the dialog was opened with. Sent back on save so only the user's own changes are diffed
  const [initialIds] = useState<number[]>(selectedIds);
  const [draftIds, setDraftIds] = useState<number[]>(initialIds);
  const [newName, setNewName] = useState("");
  // Feedback from the dialog itself, e.g. when the category is already chosen
  const [message, setMessage] = useState<string | null>(null);

  // The dialog's own message goes first, then errors from saving
  const shownMessage = message ?? error;

  // Categories currently chosen in the dialog (shown as removable tags)
  const draftCategories = categories.filter((c) => draftIds.includes(c.id));
  // Categories that can still be added (shown in the select)
  const availableCategories = categories.filter(
    (c) => !draftIds.includes(c.id),
  );

  // Only changes the draft. Nothing is saved until the user presses save
  function addToDraft(id: number) {
    setDraftIds((ids) => [...ids, id]);
  }

  function removeFromDraft(id: number) {
    setDraftIds((ids) => ids.filter((i) => i !== id));
  }

  // Creates a new category in the database and selects it right away
  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;

    // "Villa" and "villa" are the same category. If it exists, select it instead of
    // creating a duplicate (the database only treats identical spelling as equal)
    const existing = categories.find(
      (c) => c.tag_name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) {
      // Already chosen: keep the text and tell the user, so it does not look like nothing happened
      if (draftIds.includes(existing.id)) {
        setMessage(`Kategorin ${capitalize(existing.tag_name)} är redan vald.`);
        return;
      }
      addToDraft(existing.id);
      setNewName("");
      return;
    }

    const category = await onCreateCategory(name);
    if (category) {
      addToDraft(category.id);
      setNewName("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[80vw]">
        <DialogHeader>
          <DialogTitle>Kategorisera objekt</DialogTitle>
        </DialogHeader>

        <View className="gap-6">
          {/* --- CHOOSE FROM EXISTING CATEGORIES --- */}

          <View className="gap-2">
            <Label>Dina kategorier</Label>
            <Select
              onValueChange={(option) => {
                if (option) addToDraft(Number(option.value));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Välj kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Dina kategorier</SelectLabel>
                  {availableCategories.map((c) => (
                    <SelectItem
                      key={c.id}
                      label={capitalize(c.tag_name)}
                      value={String(c.id)}
                    />
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </View>

          {/* --- CREATE A NEW CATEGORY --- */}
          <View className="gap-2">
            <Label>Lägg till kategori</Label>
            <View className="flex-row gap-2 flex-wrap">
              <Input
                className="flex-1"
                value={newName}
                onChangeText={(text) => {
                  setNewName(text);
                  // The old messages were about the previous text
                  setMessage(null);
                  onClearError();
                }}
                placeholder="T.ex. Balkong"
                maxLength={TAG_NAME_MAX_LENGTH}
              />
              <Button
                disabled={isSaving || newName.trim() === ""}
                variant="outline"
                onPress={handleCreate}
              >
                <Text>Lägg till</Text>
              </Button>
            </View>
          </View>

          {/* --- CHOSEN CATEGORY --- */}
          <View>
            <Label>Valda kategorier</Label>
            <View className="flex-row gap-2 flex-wrap">
              {draftCategories.length === 0 && (
                <Text>Inga valda kategorier.</Text>
              )}
              {draftCategories.map((c) => (
                <Pressable key={c.id} onPress={() => removeFromDraft(c.id)}>
                  <CategoryTag text={c.tag_name} removable />
                </Pressable>
              ))}
            </View>
          </View>

          {shownMessage && <FormError>{shownMessage}</FormError>}
        </View>

        <DialogFooter>
          <View className="flex-1 gap-4">
            <Button
              disabled={isSaving}
              onPress={() => onSave(draftIds, initialIds)}
            >
              <Text>{isSaving ? "Sparar..." : "Spara kategorisering"}</Text>
            </Button>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
