import {
  deleteAvatar,
  updateProfileAvatarPath,
} from "@/services/profiles";
import { useCallback, useState } from "react";

export function useDeleteProfileAvatar() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeAvatar = useCallback(async (userId: string, path: string) => {
    setError(null);
    setIsDeleting(true);

    try {
      const { error: storageError } = await deleteAvatar(path);
      if (storageError) throw storageError;

      const { error: profileError } = await updateProfileAvatarPath(
        userId,
        null,
      );
      if (profileError) throw profileError;

      return true;
    } catch (reason) {
      console.error("Failed to delete profile avatar:", reason);
      setError("Kunde inte ta bort profilbilden. Försök igen.");
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { removeAvatar, isDeleting, error, clearError };
}
