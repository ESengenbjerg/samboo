import { getAvatarUrl, getProfile } from "@/services/profiles";
import { InformationInterval } from "@/stores/onboarding";
import { useEffect, useState } from "react";

type Profile = {
  name: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
  notificationFrequency: InformationInterval;
};

type ProfileResult = {
  userId: string;
  profile: Profile | null;
  failed?: boolean;
};

// Profile for the logged in user. Pass undefined until the session is loaded
export function useProfile(userId: string | undefined) {
  const [result, setResult] = useState<ProfileResult | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Ignore the response if the user changed or the component unmounted
    let cancelled = false;

    getProfile(userId).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.log("Profile error:", error);
        setResult({ userId, profile: null, failed: true });
        return;
      }
      setResult({
        userId,
        profile: data
          ? {
              name: data.name,
              avatarPath: data.avatar_path,
              avatarUrl: getAvatarUrl(data.avatar_path),
              // The check constraint allows only these values, but the column is still text in the
              // generated types. Removed in part 3 of #153, when the column becomes an enum
              notificationFrequency:
                data.notification_frequency as InformationInterval,
            }
          : null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Never expose a result that belongs to a previous user
  const current = userId && result?.userId === userId ? result : null;

  return {
    profile: current?.profile ?? null,
    // Loading until we have a result for the current user
    isLoading: !!userId && !current,
    error: current?.failed ? "Kunde inte hämta din profil." : null,
  };
}
