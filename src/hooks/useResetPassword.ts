import { useCountdown } from "@/hooks/useCountdown";
import {
  passwordErrorMessage,
  requestPasswordReset,
  signOutLocal,
  signOutOtherClients,
  updatePassword,
  verifyRecoveryOtp,
} from "@/services/auth";
import { usePasswordRecoveryStore } from "@/stores/password-recovery";
import { useCallback, useEffect, useState } from "react";

// Matches Supabase's cooldown between emails to the same address
const RESEND_CODE_INTERVAL_SECONDS = 60;

// email is sent as a param from the forgot password screen
export function useResetPassword(email: string) {
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
    setIsLoading(true);

    try {
      const { error } = await requestPasswordReset(email);

      if (error) {
        console.log("Resend reset code error:", error);
        setError("Kunde inte skicka koden, försök igen.");
        return;
      }

      restartCountdown();
    } catch (e) {
      console.log("Resend reset code error:", e);
      setError("Kunde inte skicka koden, försök igen.");
    } finally {
      setIsLoading(false);
    }
  }, [email, isLoading, restartCountdown]);

  // Returns true if the code was correct
  const verifyCode = useCallback(
    async (code: string) => {
      if (isLoading) return false;
      setError(null);

      // Pasted codes may include a space
      const trimmedCode = code.trim();
      if (!trimmedCode) {
        setError("Fyll i koden från mailet.");
        return false;
      }

      // Locks the buttons while verifying. Unlocked again in finally
      setIsLoading(true);

      try {
        // On success Supabase signs the user in and sends PASSWORD_RECOVERY -> useSession sets the recovery flag, so the user stays on this screen
        const { error } = await verifyRecoveryOtp(email, trimmedCode);

        if (error) {
          console.log("Verify recovery code error:", error);
          setError(
            error.code === "otp_expired"
              ? "Koden har gått ut. Tryck på Skicka igen för en ny kod."
              : "Koden stämmer inte. Försök igen.",
          );
          return false;
        }

        return true;
      } catch (e) {
        console.log("Verify recovery code error:", e);
        setError("Något gick fel, försök igen.");
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
          setError(passwordErrorMessage(error));
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
        setError("Något gick fel, försök igen.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  return { verifyCode, resendCode, savePassword, countdown, isLoading, error };
}
