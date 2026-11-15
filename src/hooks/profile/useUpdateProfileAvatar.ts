import {
  avatarErrorMessage,
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
        setError(avatarErrorMessage(reason));

        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  // Clears profiles.avatar_path first, then deletes the file. If the file
  // delete fails we only log it, so no profile points to a missing file.
  // Returns true on success
  const removeAvatar = useCallback(
    async (userId: string, currentPath?: string | null) => {
      setError(null);
      setIsUpdating(true);

      try {
        const { error: profileError } = await updateProfileAvatarPath(
          userId,
          null,
        );
        if (profileError) throw profileError;

        if (currentPath) {
          const { error: deleteError } = await deleteAvatar(currentPath);
          if (deleteError) {
            console.warn("Could not delete avatar file:", deleteError);
          }
        }

        return true;
      } catch (reason) {
        console.error("Failed to remove profile avatar:", reason);
        setError(avatarErrorMessage(reason));

        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { updateAvatar, removeAvatar, isUpdating, error, clearError };
}
