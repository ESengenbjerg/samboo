import { useState } from "react";
import { View } from "react-native";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function DeleteAccount() {
  const [dialogOpen, setDialogOpen] = useState(false);
  // TODO: Delete when correct funtion from Supabase is implemented
  const [devIsDeleted, setDevIsDeleted] = useState(false);

  return (
    <>
      {dialogOpen && (
        <ConfirmDialog
          open={true}
          onOpenChange={() => setDialogOpen(false)}
          title={"Är du säker"}
          description={
            "Om du tar bort ditt konto försvinner alla dina listor och bevakningar. Vill du verkligen radera ditt konto?"
          }
          actionLabel={"Bekräfta radering"}
          // TODO: Implement correct funtion from Supabase
          onAction={() => setDevIsDeleted(true)}
          cancelLabel={"Avbryt"}
          onCancel={() => setDialogOpen(false)}
        />
      )}

      <View>
        <Text variant="h2">Radera konto</Text>
        <Button
          variant="destructive"
          onPress={() => setDialogOpen(true)}
          className="max-w-36"
        >
          <Text>Radera konto</Text>
        </Button>
      </View>
    </>
  );
}
