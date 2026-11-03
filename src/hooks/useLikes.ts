import { useLikesStore } from "@/stores/likes";
import { useEffect } from "react";

// Call once at the root. Loads the logged in user's likes into the store, and clears them on logout
export function useLikesSync(userId: string | undefined) {
  const load = useLikesStore((s) => s.load);
  const reset = useLikesStore((s) => s.reset);

  useEffect(() => {
    if (userId) load(userId);
    else reset();
  }, [userId, load, reset]);
}
