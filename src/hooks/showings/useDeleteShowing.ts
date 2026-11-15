import { deleteShowing } from "@/services/showings";
import { commonErrorMessage } from "@/utils/error-message/common-messages";
import { useCallback, useState } from "react";

export function useDeleteShowing() {
  const [isDeleting, setIsDeleting] = useState(false);

  // Returns null if the showing was deleted, otherwise the message to show the user
  const remove = useCallback(async (id: number): Promise<string | null> => {
    setIsDeleting(true);

    const { error } = await deleteShowing(id);
    setIsDeleting(false);

    if (error) {
      console.error("Failed to delete showing:", error);
      return commonErrorMessage(
        error,
        "Kunde inte radera visningen. Försök igen.",
      );
    }
    return null;
  }, []);

  return { deleteShowing: remove, isDeleting };
}
