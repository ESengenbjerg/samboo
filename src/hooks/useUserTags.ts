import { getUserTags } from "@/services/tags";
import { UserTag } from "@/types/tags";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

type UserTagsResult = {
  userId: string;
  tags: UserTag[];
  failed?: boolean;
};

// The tags I have created. Pass undefined until the session is loaded
export function useUserTags(userId: string | undefined) {
  const [result, setResult] = useState<UserTagsResult | null>(null);
  // Bumped by reload() to fetch again, e.g. after saving a change
  const [reloadCount, setReloadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      // Ignore the response if the user changed or the screen lost focus
      let cancelled = false;

      getUserTags().then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load tags: ", error);
          setResult({ userId, tags: [], failed: true });
          return;
        }
        setResult({ userId, tags: data });
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
    tags: current?.tags ?? [],
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta dina kategorier." : null,
  };
}
