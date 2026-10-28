import { getOnboardingStatus } from "@/services/profiles";
import { useCallback, useEffect, useState } from "react";

type OnboardingStatus = {
  userId: string;
  isOnboarded: boolean;
  failed?: boolean;
};

// Onboarding status for a specific user, so a stale value is never used for a new session
export function useOnboardingStatus(userId: string | undefined) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  // Changes when retry() is called so the fetch retries
  const [retryCount, setRetryCount] = useState(0);

  // Get onboarding status when the logged in user changes
  useEffect(() => {
    if (!userId) return;

    getOnboardingStatus(userId).then(({ data, error }) => {
      if (error) {
        console.log("Profile error:", error);
        setStatus({ userId, isOnboarded: false, failed: true });
        return;
      }
      setStatus({
        userId,
        isOnboarded: !!data?.onboarding_completed_at,
      });
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
