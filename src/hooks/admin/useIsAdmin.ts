import { isAdmin } from "@/services/admin";
import { useCallback, useEffect, useState } from "react";

type AdminStatus = {
  userId: string;
  isAdmin: boolean;
  failed?: boolean;
};

// Admin status for a specific user, so a stale value is never used for a new session. Same pattern as useOnboardingStatus
export function useIsAdmin(userId: string | undefined) {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  // Changes when retry() is called so the fetch retries
  const [retryCount, setRetryCount] = useState(0);

  // Get admin status when the logged in user changes
  useEffect(() => {
    if (!userId) return;

    isAdmin().then(({ data, error }) => {
      if (error) {
        console.log("Admin status error:", error);
        setStatus({ userId, isAdmin: false, failed: true });
        return;
      }
      setStatus({ userId, isAdmin: data });
    });

    // Clear on logout/user change so the status is fetched again next login
    return () => setStatus(null);
  }, [userId, retryCount]);

  const retry = useCallback(() => {
    setStatus(null);
    setRetryCount((c) => c + 1);
  }, []);

  // Never expose a status that belongs to a previous user
  const current = userId && status?.userId === userId ? status : null;

  return { status: current, retry };
}
