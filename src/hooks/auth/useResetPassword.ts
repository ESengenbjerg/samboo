import { RESEND_CODE_INTERVAL_SECONDS } from "@/constants/limits";
import { useCountdown } from "@/hooks/useCountdown";
import {
  requestPasswordReset,
  signOutLocal,
  signOutOtherClients,
  updatePassword,
  verifyRecoveryOtp,
} from "@/services/auth";
import { usePasswordRecoveryStore } from "@/stores/password-recovery";
import {
  authCatchMessage,
  authErrorMessage,
  isRateLimitError,
} from "@/utils/error-message/auth-error-message";
import { useCallback, useEffect, useState } from "react";

// email is sent as a param from the forgot password screen
export function useResetPassword(email: string) {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The code was just sent from the forgot password screen, so the countdown starts right away
  const { countdown, restartCountdown } = useCountdown(
    RESEND_CODE_INTERVAL_SECONDS,
  );

  // Leaving the screen after the code is verified but before a new password is saved (Tillbaka, swipe back, Android back) ends the recovery session.
  // Otherwise the user stays signed in with the flag set and gets stuck in (auth) at the next sign-in
  useEffect(() => {
    return () => {
      if (usePasswordRecoveryStore.getState().isRecovering) {
        signOutLocal();
      }
    };
  }, []);

  const resendCode = useCallback(async () => {
    if (isLoading) return;
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const { error } = await requestPasswordReset(email);

      if (isRateLimitError(error)) {
        console.log("Resend reset code error:", error);
        setError(authErrorMessage(error));
        restartCountdown();
        return;
      }

      if (error) {
        console.log("Resend reset code error:", error);
        setError(authErrorMessage(error));
        return;
      }

      restartCountdown();
      setMessage("Ny kod skickad.");
    } catch (e) {
      console.log("Resend reset code error:", e);
      setError(authCatchMessage(e, "Kunde inte skicka koden. Försök igen."));
    } finally {
      setIsLoading(false);
    }
  }, [email, isLoading, restartCountdown]);

  // Returns true if the code was correct
  const verifyCode = useCallback(
    async (code: string) => {
      if (isLoading) return false;
      setError(null);
      setMessage(null);

      // Pasted codes may include a space
      const trimmedCode = code.trim();
      if (!trimmedCode) {
        setError("Fyll i koden från mejlet.");
        return false;
      }

      // Locks the buttons while verifying. Unlocked again in finally
      setIsLoading(true);

      try {
        // On success Supabase signs the user in and sends PASSWORD_RECOVERY -> useSession sets the recovery flag, so the user stays on this screen
        const { error } = await verifyRecoveryOtp(email, trimmedCode);

        if (error) {
          console.log("Verify recovery code error:", error);
          // Supabase uses otp_expired for both a wrong and an expired code, so the message covers both
          setError(authErrorMessage(error));
          return false;
        }

        return true;
      } catch (e) {
        console.log("Verify recovery code error:", e);
        setError(
          authCatchMessage(e, "Kunde inte verifiera koden. Försök igen."),
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [email, isLoading],
  );

  const savePassword = useCallback(
    async (password: string, repeatPassword: string) => {
      if (isLoading) return;
      setError(null);

      // Protects against "" === ""
      if (!password) {
        setError("Fyll i ett nytt lösenord.");
        return;
      }
      if (password !== repeatPassword) {
        setError("Lösenorden matchar inte.");
        return;
      }

      setIsLoading(true);

      try {
        const { error } = await updatePassword(password);

        if (error) {
          console.log("Update password error:", error);
          setError(authErrorMessage(error));
          return;
        }

        // Signs out other devices, in case someone else had access to the account
        const { error: signOutError } = await signOutOtherClients();
        if (signOutError)
          console.log("Sign out other clients error:", signOutError);

        // The reset is done: the root layout now sees a normal signed-in user and sends them into the app, so no navigation is needed here
        usePasswordRecoveryStore.getState().setIsRecovering(false);
      } catch (e) {
        console.log("Update password error:", e);
        setError(
          authCatchMessage(e, "Kunde inte spara lösenordet. Försök igen."),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  return {
    verifyCode,
    resendCode,
    savePassword,
    countdown,
    isLoading,
    error,
    message,
  };
}
