import { getOpenIssues } from "@/services/admin";
import { OpenIssue } from "@/types/admin";
import { useCallback, useEffect, useState } from "react";

type OpenIssuesResult = {
  issues: OpenIssue[];
  failed?: boolean;
};

// Open scrape issues, oldest first, loaded when the admin view opens. Read-only: issues close themselves on the next clean run
export function useOpenIssues() {
  const [result, setResult] = useState<OpenIssuesResult | null>(null);

  // Returns a cleanup function that makes us ignore the response if the view closed
  const fetchIssues = useCallback(() => {
    let cancelled = false;

    getOpenIssues().then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Failed to load open issues: ", error);
        // Keep the previous rows so a failed fetch doesn't look like "no issues"
        setResult((prev) => ({ issues: prev?.issues ?? [], failed: true }));
        return;
      }
      setResult({ issues: data ?? [] });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(fetchIssues, [fetchIssues]);

  return {
    issues: result?.issues ?? [],
    isLoading: !result,
    error: result?.failed ? "Kunde inte hämta öppna ärenden." : null,
    refetch: fetchIssues,
  };
}
