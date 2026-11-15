import { SHOWING_LAST_DATE, SHOWING_NOTE_MAX_LENGTH } from "@/constants/limits";
import {
  createShowing,
  NOTE_TOO_LONG_MESSAGE,
  showingErrorMessage,
} from "@/services/showings";
import { ShowingValues } from "@/types/showings";
import {
  isShowingDateInPast,
  isShowingDateTooLate,
  isValidShowingDate,
  normalizeShowingTime,
} from "@/utils/showing-validation";
import { useCallback, useState } from "react";

export function useSaveShowing() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // True if the save failed because the listing already has a showing
  const [isConflict, setIsConflict] = useState(false);

  // listingId is listings.id. Returns true if the showing was saved
  const saveShowing = useCallback(
    async (listingId: number, values: ShowingValues) => {
      setError(null);
      setIsConflict(false);

      const date = values.date.trim();
      if (!isValidShowingDate(date)) {
        setError("Skriv datumet som ÅÅÅÅ-MM-DD, t.ex. 2027-01-01.");
        return false;
      }
      if (isShowingDateInPast(date)) {
        setError("Datumet kan inte ligga i det förflutna.");
        return false;
      }
      if (isShowingDateTooLate(date)) {
        setError(`Datumet kan inte ligga efter ${SHOWING_LAST_DATE}.`);
        return false;
      }

      const startTime = normalizeShowingTime(values.time.trim());
      if (startTime === null) {
        setError("Ange en starttid.");
        return false;
      }
      if (startTime === undefined) {
        setError("Skriv tiden som TT.MM, t.ex. 11.00.");
        return false;
      }

      const note = values.note.trim();
      if (note.length > SHOWING_NOTE_MAX_LENGTH) {
        setError(NOTE_TOO_LONG_MESSAGE);
        return false;
      }

      setIsSaving(true);
      const { error } = await createShowing({
        listingId,
        date,
        startTime,
        note: note || null,
      });
      setIsSaving(false);

      if (error) {
        console.error("Failed to save showing: ", error);
        setError(showingErrorMessage(error));
        setIsConflict(error.code === "23505");
        return false;
      }
      return true;
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
    setIsConflict(false);
  }, []);

  return { saveShowing, isSaving, error, isConflict, clearError };
}
