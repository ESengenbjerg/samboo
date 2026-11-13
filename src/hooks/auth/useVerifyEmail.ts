import { RESEND_CODE_INTERVAL_SECONDS } from "@/constants/limits";
import { useCountdown } from "@/hooks/useCountdown";
import { resendSignUpCode, verifyEmailOtp } from "@/services/auth";
import {
  authCatchMessage,
  authErrorMessage,
  isRateLimitError,
} from "@/utils/error-message/auth-error-message";
import { useCallback, useEffect, useRef, useState } from "react";

// email and source are sent as params from /register or /login
export function useVerifyEmail(email: string, source?: "login" | "register") {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // From /register the code was just sent, so the countdown starts right away.
  // From /login no code has been sent yet: the countdown starts after the code below is sent
  const { countdown, restartCountdown } = useCountdown(
    RESEND_CODE_INTERVAL_SECONDS,
    source !== "login",
  );

  // Sends a new code to an unconfirmed account. Returns true if it was sent
  const sendCode = useCallback(async () => {
    try {
      const { error } = await resendSignUpCode(email);

      if (isRateLimitError(error)) {
        console.log("Resend sign up code error:", error);
        setError(authErrorMessage(error));
        restartCountdown();
        return false;
      }

      if (error) {
        console.log("Resend sign up code error:", error);
        setError(authErrorMessage(error));
        return false;
      }

      restartCountdown();
      return true;
    } catch (e) {
      console.log("Resend sign up code error:", e);
      setError(authCatchMessage(e, "Kunde inte skicka koden. Försök igen."));
      return false;
    }
  }, [email, restartCountdown]);

  // From /login the account exists but has no valid code, so one is sent when the screen opens.
  // The ref stops a second send if the effect runs again (React Strict Mode runs it twice in development)
  const hasSentInitialCode = useRef(false);
  useEffect(() => {
    if (source !== "login" || hasSentInitialCode.current) return;
    hasSentInitialCode.current = true;
    sendCode();
  }, [source, sendCode]);

  const resendCode = useCallback(async () => {
    if (isLoading) return;
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      // sendCode sets the error itself if it fails
      if (await sendCode()) setMessage("Ny kod skickad.");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sendCode]);

  // On success Supabase signs the user in and the root layout sends them to the next step, so no navigation is needed here
  const verifyCode = useCallback(
    async (code: string) => {
      if (isLoading) return;
      setError(null);
      setMessage(null);

      // Pasted codes may include a space
      const trimmedCode = code.trim();
      if (!trimmedCode) {
        setError("Fyll i koden från mejlet.");
        return;
      }

      setIsLoading(true);

      try {
        // Errors are returned in { error }, not thrown, so they are checked below
        const { error } = await verifyEmailOtp(email, trimmedCode);

        if (error) {
          console.log("Verify email code error:", error);
          // Supabase uses otp_expired for both a wrong and an expired code, so the message covers both
          setError(authErrorMessage(error));
        }
      } catch (e) {
        // Unexpected errors, e.g. the network request failing completely
        console.log("Verify email code error:", e);
        setError(
          authCatchMessage(e, "Kunde inte verifiera koden. Försök igen."),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [email, isLoading],
  );

  return { verifyCode, resendCode, countdown, isLoading, error, message };
}
