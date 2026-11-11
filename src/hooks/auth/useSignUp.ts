import { PASSWORD_MIN_LENGTH } from "@/constants/limits";
import { signUp } from "@/services/auth";
import { authErrorMessage } from "@/utils/error-message/auth-error-message";
import { isValidEmail } from "@shared/email";
import { router } from "expo-router";
import { useCallback, useState } from "react";

export function useSignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAccount = useCallback(
    async (email: string, password: string, repeatPassword: string) => {
      // The keyboard's submit can run this while the account is being created
      if (isLoading) return;
      setError(null);

      // Remove spaces, e.g. from autofill
      const trimmedEmail = email.trim();

      if (!trimmedEmail) {
        setError("Fyll i e-post.");
        return;
      }

      if (!isValidEmail(trimmedEmail)) {
        setError("Fyll i en giltig e-postadress.");
        return;
      }

      if (!password) {
        setError("Fyll i lösenord.");
        return;
      }

      // Same rule as Supabase Auth, so the user gets the message before anything is sent
      if (password.length < PASSWORD_MIN_LENGTH) {
        setError(`Lösenordet måste vara minst ${PASSWORD_MIN_LENGTH} tecken.`);
        return;
      }

      if (password !== repeatPassword) {
        setError("Lösenorden matchar inte.");
        return;
      }

      setIsLoading(true);

      try {
        // Errors are returned in { error }, not thrown, so they are checked below
        const { data, error } = await signUp(trimmedEmail, password);

        if (error) {
          console.log("Sign up error:", error);
          setError(authErrorMessage(error));
          return;
        }

        // No session = the account must be confirmed with the code from the email first.
        // Supabase answers the same for an email that already has an account, so no one can find out who has one
        if (data.session === null) {
          router.push({
            pathname: "/verify-email",
            params: { email: trimmedEmail, source: "register" },
          });
        }
      } catch (e) {
        // Unexpected errors, e.g. the network request failing completely
        console.log("Sign up error:", e);
        setError("Något gick fel, försök igen.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  return { createAccount, isLoading, error };
}
