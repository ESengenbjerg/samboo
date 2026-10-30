import { createShowing, showingErrorMessage } from "@/services/showings";
import { useCallback, useState } from "react";

// Same shape as SaveShowingDialog's onSave
type ShowingValues = {
  date: string;
  time: string;
  note: string;
};

// "2027-01-01", and a real date (not 2027-02-31)
function isValidDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

// "11.00", "11:00" or "11" -> "11:00". null if empty, undefined if invalid
function normalizeTime(time: string) {
  if (!time) return null;
  const match = time.match(/^([01]?\d|2[0-3])(?:[.:]([0-5]\d))?$/);
  if (!match) return undefined;
  return `${match[1].padStart(2, "0")}:${match[2] ?? "00"}`;
}

export function useSaveShowing() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // listingId is listings.id. Returns true if the showing was saved
  const saveShowing = useCallback(
    async (listingId: number, values: ShowingValues) => {
      setError(null);

      const date = values.date.trim();
      if (!isValidDate(date)) {
        setError("Skriv datumet som ÅÅÅÅ-MM-DD, t.ex. 2027-01-01.");
        return false;
      }

      const startTime = normalizeTime(values.time.trim());
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
