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
    }, [userId]),
  );

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    listingTags: current?.listingTags ?? [],
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta kategorier." : null,
  };
}
