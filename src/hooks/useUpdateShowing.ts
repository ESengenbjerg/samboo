import { updateShowing, showingErrorMessage } from "@/services/showings";
import { ShowingValues } from "@/types/showings";
import {
  isShowingDateInPast,
  isValidShowingDate,
  normalizeShowingTime,
} from "@/utils/showing-validation";
import { useCallback, useState } from "react";

export function useUpdateShowing() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: number, values: ShowingValues) => {
    setError(null);

    const date = values.date.trim();
    if (!isValidShowingDate(date)) {
      setError("Skriv datumet som ÅÅÅÅ-MM-DD, t.ex. 2027-01-01.");
      return false;
    }
    if (isShowingDateInPast(date)) {
      setError("Datumet kan inte ligga i det förflutna.");
      return false;
    }

    const time = normalizeShowingTime(values.time.trim());
    if (time === null) {
      setError("Ange en starttid.");
      return false;
    }
    if (time === undefined) {
      setError("Skriv tiden som TT.MM, t.ex. 11.00.");
      return false;
    }

    const note = values.note.trim();
    if (note.length > 500) {
      setError("Anteckningen får vara max 500 tecken.");
      return false;
    }

    setIsUpdating(true);
    const { error } = await updateShowing(id, {
      date,
      time,
      note,
    });
    setIsUpdating(false);

    if (error) {
      console.error("Failed to update showing:", error);
      setError(showingErrorMessage(error));
      return false;
    }
    return true;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { updateShowing: update, isUpdating, error, clearError };
}
