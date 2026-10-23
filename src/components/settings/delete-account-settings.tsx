import { useDeleteAccount } from "@/hooks/useDeleteAccount";
import { useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function DeleteAccount() {
  const { deleteAccount, isDeleting, error } = useDeleteAccount();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      {dialogOpen && (
        <ConfirmDialog
          open={true}
          onOpenChange={() => setDialogOpen(false)}
          title={"Är du säker?"}
          description={
            "Om du tar bort ditt konto försvinner alla dina listor och bevakningar. Vill du verkligen radera ditt konto?"
          }
          actionLabel={isDeleting ? "Raderar..." : "Bekräfta radering"}
          onAction={async () => {
            const deleted = await deleteAccount();
            if (!deleted) setDialogOpen(false);
          }}
          cancelLabel={"Avbryt"}
          onCancel={() => setDialogOpen(false)}
          isLoading={isDeleting}
        />
      )}

      {error && <FormError>{error}</FormError>}

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
