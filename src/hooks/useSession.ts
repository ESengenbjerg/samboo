import { getSession, onAuthStateChange } from "@/services/auth";
import { useOnboardingStore } from "@/stores/onboarding";
import { usePasswordRecoveryStore } from "@/stores/password-recovery";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  // True once the stored session has been read (it can be null = logged out)
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  // Load session and listen to login/logout
  useEffect(() => {
    getSession().then(({ data }) => {
      setSession(data.session);
      setIsSessionLoaded(true);
    });

    return onAuthStateChange((event, session) => {
      // A valid reset code signs the user in. Set the flag before the session, so the guard never sees the session without it
      if (event === "PASSWORD_RECOVERY") {
        usePasswordRecoveryStore.getState().setIsRecovering(true);
      }

      setSession(session);
      if (!session) {
        // Resets onboarding to not affect next user.
        // Will be read from Supabase next time
        useOnboardingStore.getState().reset();
        usePasswordRecoveryStore.getState().setIsRecovering(false);
      }
    });
  }, []);

  return { session, isSessionLoaded };
}
