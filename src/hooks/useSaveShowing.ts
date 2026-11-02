import { createShowing, showingErrorMessage } from "@/services/showings";
import { ShowingValues } from "@/types/showings";
import {
  isShowingDateInPast,
  isValidShowingDate,
  normalizeShowingTime,
} from "@/utils/showing-validation";
import { useCallback, useState } from "react";

export function useSaveShowing() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // listingId is listings.id. Returns true if the showing was saved
  const saveShowing = useCallback(
    async (listingId: number, values: ShowingValues) => {
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
      if (note.length > 500) {
        setError("Anteckningen får vara max 500 tecken.");
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
        return false;
      }
      return true;
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { saveShowing, isSaving, error, clearError };
}
