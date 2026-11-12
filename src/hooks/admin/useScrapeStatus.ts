import { getScrapeStatus } from "@/services/admin";
import { AgencyStatus } from "@/types/admin";
import { useCallback, useEffect, useState } from "react";

type ScrapeStatusResult = {
  agencies: AgencyStatus[];
  failed?: boolean;
};

// Scraper status per agency, loaded when the admin view opens. refetch() loads it again
export function useScrapeStatus() {
  const [result, setResult] = useState<ScrapeStatusResult | null>(null);

  // Returns a cleanup function that makes us ignore the response if the view closed
  const fetchStatus = useCallback(() => {
    let cancelled = false;

    getScrapeStatus().then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Failed to load scrape status: ", error);
        // Keep the previous rows so a failed fetch doesn't look like an empty list
        setResult((prev) => ({ agencies: prev?.agencies ?? [], failed: true }));
        return;
      }
      setResult({ agencies: data ?? [] });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(fetchStatus, [fetchStatus]);

  return {
    agencies: result?.agencies ?? [],
    isLoading: !result,
    error: result?.failed ? "Kunde inte hämta byråstatus." : null,
    refetch: fetchStatus,
  };
}
