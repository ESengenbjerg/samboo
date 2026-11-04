import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { UserTag } from "@/types/tags";
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
  onSave: (selectedIds: number[]) => void;
  isSaving: boolean;
  error: string | null;
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
}: CategoriesDialogProps) {
  // Save draft only when user presses save
  const [draftIds, setDraftIds] = useState<number[]>(selectedIds);
  const [newName, setNewName] = useState("");

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
          <DialogTitle>Spara objekt</DialogTitle>
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
                      label={c.tag_name}
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
                onChangeText={setNewName}
                placeholder="T.ex. Balkong"
                maxLength={100}
              />
              <Button variant="outline" onPress={handleCreate}>
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

          {error && <FormError>{error}</FormError>}
        </View>

        <DialogFooter>
          <View className="flex-1 gap-4">
            <Button disabled={isSaving} onPress={() => onSave(draftIds)}>
              <Text>Spara objekt</Text>
            </Button>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
