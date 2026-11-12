import { signIn } from "@/services/auth";
import { authErrorMessage } from "@/utils/error-message/auth-error-message";
import { isValidEmail } from "@shared/email";
import { router } from "expo-router";
import { useCallback, useState } from "react";

export function useSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On success the root layout sees the new session and sends the user into the app, so no navigation is needed here
  const logIn = useCallback(
    async (email: string, password: string) => {
      // The keyboard's submit can run this while signing in
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

      setIsLoading(true);

      try {
        // Errors are returned in { error }, not thrown, so they are checked below
        const { error } = await signIn(trimmedEmail, password);

        if (error) {
          console.log("Sign in error:", error);

          // The account exists but the email was never confirmed: /verify-email sends a new code
          if (error.code === "email_not_confirmed") {
            router.push({
              pathname: "/verify-email",
              params: { email: trimmedEmail, source: "login" },
            });
            return;
          }

          setError(
            error.code === "invalid_credentials"
              ? "Fel e-post eller lösenord."
              : authErrorMessage(error),
          );
        }
      } catch (e) {
        // Unexpected errors, e.g. the network request failing completely
        console.log("Sign in error:", e);
        setError("Något gick fel, försök igen.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  return { logIn, isLoading, error };
}
