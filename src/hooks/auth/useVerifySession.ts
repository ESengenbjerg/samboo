import { verifySessionWithServer } from "@/services/auth";
import { useEffect } from "react";
import { AppState } from "react-native";

// A session revoked on another device keeps a valid token locally until it expires.
// Asking the server at start and when the app becomes active signs it out at once:
// useSession() gets SIGNED_OUT and the root layout sends the user to the login screen.
// While the app stays open, a failed token refresh signs it out once the access token has expired (within about 7 minutes; access tokens live 5).
// Call it once, in the root layout: every instance adds its own listener
export function useVerifySession() {
  useEffect(() => {
    verifySessionWithServer();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") verifySessionWithServer();
    });

    return () => subscription.remove();
  }, []);
}
