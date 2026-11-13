import { getListingTags } from "@/services/tags";
import { ListingTag } from "@/types/tags";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type ListingTagsResult = {
  userId: string;
  listingTags: ListingTag[];
  failed?: boolean;
};

// Which of my tags are applied to which listing (by user_listing_id).
// Pass undefined until the session is loaded
export function useListingTags(userId: string | undefined) {
  const [result, setResult] = useState<ListingTagsResult | null>(null);
  // Bumped by reload() to fetch again, e.g. after saving a change
  const [reloadCount, setReloadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      getListingTags().then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load listing tags: ", error);
          setResult({ userId, listingTags: [], failed: true });
          return;
        }
        setResult({ userId, listingTags: data });
      });

      return () => {
        cancelled = true;
      };
    // reloadCount is not read in the callback. It is a dependency on purpose, so a new
    // callback (and a new fetch) is created every time reload() is called
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, reloadCount]),
  );

  const reload = useCallback(() => setReloadCount((c) => c + 1), []);

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    reload,
    listingTags: current?.listingTags ?? [],
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta taggar." : null,
  };
}
