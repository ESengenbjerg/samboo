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
    }, [userId]),
  );

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    tags: current?.tags ?? [],
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta dina kategorier." : null,
  };
}
