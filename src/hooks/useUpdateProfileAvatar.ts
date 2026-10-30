import {
  deleteAvatar,
  updateProfileAvatarPath,
  uploadAvatar,
} from "@/services/profiles";
import { useCallback, useState } from "react";

export function useUpdateProfileAvatar() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAvatar = useCallback(
    async (userId: string, uri: string, previousPath?: string | null) => {
      setError(null);
      setIsUpdating(true);

      try {
        const avatarPath = await uploadAvatar(userId, uri);
        const { error: profileError } = await updateProfileAvatarPath(
          userId,
          avatarPath,
        );

        if (profileError) {
          await deleteAvatar(avatarPath);
          throw profileError;
        }

        if (previousPath) {
          const { error: deleteError } = await deleteAvatar(previousPath);
          if (deleteError) {
            console.warn("Could not delete previous avatar:", deleteError);
          }
        }

        return avatarPath;
      } catch (reason) {
        console.error("Failed to update profile avatar:", reason);
        setError(
          reason instanceof Error
            ? reason.message
            : "Kunde inte uppdatera profilbilden.",
        );
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { updateAvatar, isUpdating, error, clearError };
}
