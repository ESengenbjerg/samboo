import { getSearchParams } from "@/services/search-params";
import { ClientFilter, ScraperFilter } from "@/stores/onboarding";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type SearchParamsResult = {
  userId: string;
  scraperFilter: ScraperFilter | null;
  clientFilter: ClientFilter | null;
  failed?: boolean;
};

// The saved search for the logged in user, in the same shape as the filter form.
// Pass undefined until the session is loaded. Both filters are null if the user has no saved search
export function useSearchParams(userId: string | undefined) {
  const [result, setResult] = useState<SearchParamsResult | null>(null);

  // Refetch on every focus, so a failed request is retried when the user returns to the tab
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      getSearchParams(userId).then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.log("Search params error:", error);
          setResult({
            userId,
            scraperFilter: null,
            clientFilter: null,
            failed: true,
          });
          return;
        }
        if (!data) {
          setResult({ userId, scraperFilter: null, clientFilter: null });
          return;
        }
        setResult({
          userId,
          scraperFilter: {
            municipalities: data.municipalities,
            propertyTypes: data.property_types,
          },
          clientFilter: {
            area: data.areas,
            // null in the database means no limit, which the form calls undefined
            minRooms: data.min_rooms ?? undefined,
            maxMonthlyFee: data.max_monthly_fee ?? undefined,
            minLivingArea: data.min_living_area ?? undefined,
            // null counts as true
            shownewConstruction: data.include_new_construction ?? true,
          },
        });
      });

      return () => {
        cancelled = true;
      };
    }, [userId]),
  );

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    scraperFilter: current?.scraperFilter ?? null,
    clientFilter: current?.clientFilter ?? null,
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta din bevakning." : null,
  };
}
