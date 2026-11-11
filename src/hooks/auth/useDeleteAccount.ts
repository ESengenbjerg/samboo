import { deleteMyAccount, signOutLocal } from "@/services/auth";
import { useCallback, useState } from "react";

export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Returns true if the account was deleted
  const deleteAccount = useCallback(async () => {
    setError(null);
    setIsDeleting(true);

    const { error } = await deleteMyAccount();
    if (error) {
      console.log("Delete account error:", error);
      setError("Kunde inte radera ditt konto. Försök igen om en stund.");
      setIsDeleting(false);
      return false;
    }

    // The account is gone but the token is still stored on the device.
    // Clearing it fires SIGNED_OUT, which sends the user to the login screen
    await signOutLocal();
    return true;
  }, []);

  return { deleteAccount, isDeleting, error };
}
