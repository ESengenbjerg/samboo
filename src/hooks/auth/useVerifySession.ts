import { verifySessionWithServer } from "@/services/auth";
import { useEffect } from "react";
import { AppState } from "react-native";

// How often an open, active app checks that its session has not been revoked
const SESSION_CHECK_INTERVAL_MS = 60_000;

// A session revoked on another device keeps a valid token locally until it expires.
// Asking the server at start, when the app becomes active and once a minute signs it out at once:
// useSession() gets SIGNED_OUT and the root layout sends the user to the login screen.
// Call it once, in the root layout: every instance runs its own timer
export function useVerifySession() {
  useEffect(() => {
    verifySessionWithServer();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") verifySessionWithServer();
    });
    const interval = setInterval(() => {
      if (AppState.currentState === "active") verifySessionWithServer();
    }, SESSION_CHECK_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);
}
