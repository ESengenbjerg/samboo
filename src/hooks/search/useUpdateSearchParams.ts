import {
  saveSearchParams,
  searchParamsErrorMessage,
} from "@/services/search-params";
import { ClientFilter, ScraperFilter } from "@/stores/onboarding";
import { useCallback, useState } from "react";

export function useUpdateSearchParams() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Returns true on success
  const updateSearchParams = useCallback(
    async (
      userId: string,
      scraperFilter: ScraperFilter,
      clientFilter: ClientFilter,
    ) => {
      setError(null);
      setIsUpdating(true);

      try {
        const { error: saveError } = await saveSearchParams(
          userId,
          scraperFilter,
          clientFilter,
        );
        if (saveError) throw saveError;

        return true;
      } catch (reason) {
        console.error("Failed to update search params:", reason);
        setError(searchParamsErrorMessage(reason as { message?: string }));

        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { updateSearchParams, isUpdating, error, clearError };
}
