import { getSession, onAuthStateChange } from "@/services/auth";
import { useOnboardingStore } from "@/stores/onboarding";
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

    return onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Resets onboarding to not affect next user.
        // Will be read from Supabase next time
        useOnboardingStore.getState().reset();
      }
    });
  }, []);

  return { session, isSessionLoaded };
}
