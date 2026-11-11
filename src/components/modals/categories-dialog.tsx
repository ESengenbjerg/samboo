import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { MAX_TAGS_PER_USER, TAG_NAME_MAX_LENGTH } from "@/constants/limits";
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
  // newNames = taggar som ska skapas först när användaren sparar
  onSave: (
    selectedIds: number[],
    initialIds: number[],
    newNames: string[],
  ) => void;
  isSaving: boolean;
  error: string | null;
  onClearError: () => void;
};

export function CategoriesDialog({
  open,
  onOpenChange,
  categories,
  selectedIds,
  onSave,
  isSaving,
  error,
  onClearError,
}: CategoriesDialogProps) {
  // What the dialog was opened with. Sent back on save so only the user's own changes are diffed
  const [initialIds] = useState<number[]>(selectedIds);
  const [draftIds, setDraftIds] = useState<number[]>(initialIds);
  // Names typed in the dialog. They are NOT created until the user presses save
  const [pendingNames, setPendingNames] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  // Feedback from the dialog itself, e.g. when the category is already chosen
  const [message, setMessage] = useState<string | null>(null);

  // The dialog's own message goes first, then errors from saving
  const shownMessage = message ?? error;

  // After a save that failed halfway, a pending name can exist in the database already.
  // Those are not "new" any more, so they are not counted or shown as new
  const newNames = pendingNames.filter(
    (n) =>
      !categories.some((c) => c.tag_name.toLowerCase() === n.toLowerCase()),
  );

  // The database allows MAX_TAGS_PER_USER categories per user, counting the ones not saved yet
  const totalCount = categories.length + newNames.length;
  const isFull = totalCount >= MAX_TAGS_PER_USER;

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

  function removePendingName(name: string) {
    setPendingNames((names) => names.filter((n) => n !== name));
  }

  // Adds the typed name to the draft. Nothing is created in the database yet
  async function handleAdd() {
    const name = capitalize(newName.trim());
    if (!name) return;

    // "Villa" and "villa" are the same category. If it exists, select it instead of
    // creating a duplicate (the database only treats identical spelling as equal)
    const existing = categories.find(
      (c) => c.tag_name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) {
      // Already chosen: keep the text and tell the user, so it does not look like nothing happened
      if (draftIds.includes(existing.id)) {
        setMessage(`Taggen ${capitalize(existing.tag_name)} är redan vald.`);
        return;
      }
      addToDraft(existing.id);
      setNewName("");
      return;
    }

    // Alredady typed in this dialog but not saved yet
    if (newNames.some((n) => n.toLowerCase() === name.toLocaleLowerCase())) {
      setMessage(`Taggen ${name} är redan tillagd.`);
    }

    setPendingNames((names) => [...names, name]);
    setNewName("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-8">
        <DialogHeader>
          <DialogTitle>Tagga objekt</DialogTitle>
        </DialogHeader>

        <View className="gap-6">
          {/* --- CHOOSE FROM EXISTING CATEGORIES --- */}
          <View className="gap-2">
            <Label>Dina taggar</Label>
            <Select
              onValueChange={(option) => {
                if (option) addToDraft(Number(option.value));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Välj tagg" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Dina taggar</SelectLabel>
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

          {/* --- CREATE A NEW CATEGORY (creates on save) --- */}
          <View className="gap-2">
            <View className="flex-row gap-2">
              <Label>Lägg till tagg</Label>
              <Text variant="small">(max 20 tecken)</Text>
            </View>
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
                editable={!isFull}
              />
              <Button
                disabled={isFull || isSaving || newName.trim() === ""}
                variant="outline"
                onPress={handleAdd}
              >
                <Text>Lägg till</Text>
              </Button>
            </View>
            {isFull && (
              <Text variant="small">
                {`Du har nått gränsen på ${MAX_TAGS_PER_USER} taggar. Välj bland dina befintliga ovan.`}
              </Text>
            )}
          </View>

          {/* --- CHOSEN TAG --- */}
          <View>
            <Label>Valda taggar</Label>
            <View className="flex-row gap-2 flex-wrap">
              {draftCategories.length === 0 && newNames.length === 0 && (
                <Text>Inga valda taggar.</Text>
              )}
              {draftCategories.map((c) => (
                <Pressable key={c.id} onPress={() => removeFromDraft(c.id)}>
                  <CategoryTag text={c.tag_name} removable />
                </Pressable>
              ))}
              {newNames.map((n) => (
                <Pressable key={n} onPress={() => removePendingName(n)}>
                  <CategoryTag text={`${n} (ny)`} removable />
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
              onPress={() => onSave(draftIds, initialIds, newNames)}
            >
              <Text>{isSaving ? "Sparar..." : "Spara taggning"}</Text>
            </Button>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
