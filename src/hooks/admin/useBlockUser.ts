import { findUser, setUserActive } from "@/services/admin";
import { AdminUser } from "@/types/admin";
import { useCallback, useState } from "react";

// Finds one user by e-mail and blocks or unblocks them. After a block/unblock the user is fetched again, so the card shows the status from the database
export function useBlockUser() {
  // undefined = not searched yet, null = no user with that e-mail
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setError(null);
    const { data, error } = await findUser(trimmed);
    setIsSearching(false);

    if (error) {
      console.error("Failed to find user: ", error);
      setUser(undefined);
      setError("Kunde inte söka efter användaren.");
      return;
    }
    setUser(data?.[0] ?? null);
  }, []);

  // Returns true if the change was saved
  const setActive = useCallback(
    async (target: AdminUser, active: boolean) => {
      setIsSubmitting(true);
      setError(null);
      const { error } = await setUserActive(target.id, active);

      if (error) {
        setIsSubmitting(false);
        // The database's Swedish messages ("Du kan inte spärra dig själv", "Användaren finns inte") are shown as is
        setError(error.message);
        return false;
      }

      // Fetch again instead of flipping is_active locally, so the card shows what the database has
      const { data } = await findUser(target.email);
      setUser(data?.[0] ?? { ...target, is_active: active });
      setIsSubmitting(false);
      return true;
    },
    [],
  );

  // Called when the admin edits the e-mail, so an old error does not linger
  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    isSearching,
    isSubmitting,
    error,
    search,
    setActive,
    clearError,
  };
}
