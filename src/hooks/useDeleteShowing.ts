import { deleteShowing } from "@/services/showings";
import { useCallback, useState } from "react";

export function useDeleteShowing() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: number) => {
    setError(null);
    setIsDeleting(true);

    const { error } = await deleteShowing(id);
    setIsDeleting(false);

    if (error) {
      console.error("Failed to delete showing:", error);
      setError("Kunde inte radera visningen. Försök igen.");
      return false;
    }
    return true;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { deleteShowing: remove, isDeleting, error, clearError };
}
