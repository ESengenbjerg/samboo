import { SHOWING_LAST_DATE, SHOWING_NOTE_MAX_LENGTH } from "@/constants/limits";
import {
  NOTE_TOO_LONG_MESSAGE,
  showingErrorMessage,
  updateShowing,
} from "@/services/showings";
import { ShowingValues } from "@/types/showings";
import {
  isShowingDateInPast,
  isShowingDateTooLate,
  isValidShowingDate,
  normalizeShowingTime,
} from "@/utils/showing-validation";
import { useCallback, useState } from "react";

export function useUpdateShowing() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True if the update matched no row: the showing was deleted by someone else
  const [isGone, setIsGone] = useState(false);

  // originalDate is the showing's current date ("2027-01-15"). A past showing keeps its
  // date when only the note or time is edited, so the date is only checked if it changed
  const update = useCallback(
    async (id: number, values: ShowingValues, originalDate: string) => {
      setError(null);
      setIsGone(false);

      const date = values.date.trim();
      if (!isValidShowingDate(date)) {
        setError("Skriv datumet som ÅÅÅÅ-MM-DD, t.ex. 2027-01-01.");
        return false;
      }
      if (date !== originalDate && isShowingDateInPast(date)) {
        setError("Datumet kan inte ligga i det förflutna.");
        return false;
      }
      if (isShowingDateTooLate(date)) {
        setError(`Datumet kan inte ligga efter ${SHOWING_LAST_DATE}.`);
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
      if (note.length > SHOWING_NOTE_MAX_LENGTH) {
        setError(NOTE_TOO_LONG_MESSAGE);
        return false;
      }

      setIsUpdating(true);
      const { data, error } = await updateShowing(id, {
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

      // No error, but no row was updated: the showing no longer exists
      if (!data || data.length === 0) {
        setIsGone(true);
        setError("Visningen har tagits bort av någon i din grupp.");
        return false;
      }
      return true;
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
    setIsGone(false);
  }, []);

  return { updateShowing: update, isUpdating, isGone, error, clearError };
}
