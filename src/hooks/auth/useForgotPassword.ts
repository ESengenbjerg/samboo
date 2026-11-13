import { requestPasswordReset } from "@/services/auth";
import { authErrorMessage } from "@/utils/error-message/auth-error-message";
import { isValidEmail } from "@shared/email";
import { useCallback, useState } from "react";

export function useForgotPassword() {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sends a reset code to the email. Returns true if it was sent
  const sendResetCode = useCallback(
    async (email: string) => {
      // The keyboard's submit can run this while sending. A second request would hit Supabase's cooldown and trigger an error after the user has moved on
      if (isSending) return false;
      setError(null);

      if (!isValidEmail(email)) {
        setError("Fyll i en giltig mejladress.");
        return false;
      }

      setIsSending(true);

      try {
        // Supabase answers the same whether the account exists or not, so the form can't be used to find out who has an account.
        // Errors are returned in { error }, not thrown, so they are checked below
        const { error } = await requestPasswordReset(email);

        if (error) {
          console.log("Reset password error:", error);
          setError(authErrorMessage(error));
          return false;
        }

        return true;
      } catch (e) {
        // Unexpected errors, e.g. the network request failing completely
        console.log("Reset password error:", e);
        setError("Något gick fel, försök igen.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [isSending],
  );

  return { sendResetCode, isSending, error };
}
