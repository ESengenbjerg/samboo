import { useDeleteAccount } from "@/hooks/auth/useDeleteAccount";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import FormError from "../form-error";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

export default function DeleteAccount() {
  const { deleteAccount, isDeleting, error, clearError } = useDeleteAccount();
  const [dialogOpen, setDialogOpen] = useState(false);

  // The tab never unmounts, so clear old errors when the user leaves it
  useFocusEffect(
    useCallback(() => {
      return () => clearError();
    }, [clearError]),
  );

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

      <View className="gap-2 mb-6">
        <Text variant="h2">Radera konto</Text>
        <Button
          variant="destructive"
          onPress={() => setDialogOpen(true)}
          className="max-w-36"
        >
          <Text>Radera konto</Text>
        </Button>
        {error && <FormError>{error}</FormError>}
      </View>
    </>
  );
}
